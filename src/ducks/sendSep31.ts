import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";

import { start, sign, send } from "methods/sep10Auth";
import {
  checkToml,
  checkInfo,
  getSep12Fields,
  putSep12Fields,
  postTransaction,
  pollTransactionUntilReady,
  sendPayment,
  pollTransactionUntilComplete,
} from "methods/sep31Send";

import {
  ActionStatus,
  AnyObject,
  SendSep31InitialState,
  RejectMessage,
} from "types/types.d";

interface FetchSendFieldsActionResponse {
  assetCode: string;
  assetIssuer: string;
  token: string;
  fields: {
    transaction: any;
    sender: any;
    receiver: any;
  };
  senderSep12Type: string;
  receiverSep12Type: string;
  senderSep12Memo: string;
  receiverSep12Memo: string;
  authEndpoint: string;
  sendServer: string;
  kycServer: string;
}

export const fetchSendFieldsAction = createAsyncThunk<
  FetchSendFieldsActionResponse,
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendSep31/fetchSendFieldsAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    try {
      const { homeDomain, pubnet } = settingsSelector(getState());
      const { secretKey } = accountSelector(getState());
      const networkConfig = getNetworkConfig(pubnet);

      // Check toml
      log.instruction({ title: "Initiate a direct payment request" });

      const tomlResponse = await checkToml({ homeDomain, pubnet });
      const { authEndpoint, sendServer, kycServer } = tomlResponse;

      // Check Info
      const infoResponse = await checkInfo({ assetCode, sendServer });

      // SEP-10 start
      const challengeTransaction = await start({
        authEndpoint,
        secretKey,
      });

      // SEP-10 sign
      const signedChallengeTransaction = sign({
        secretKey,
        networkPassphrase: networkConfig.network,
        challengeTransaction,
      });

      // SEP-10 send
      const token = await send({ authEndpoint, signedChallengeTransaction });
      console.log("token: ", token);

      // Get SEP-12 fields
      const sep12Fields = await getSep12Fields({
        kycServer,
        secretKey,
        token,
        senderSep12Type: infoResponse.senderSep12Type,
        receiverSep12Type: infoResponse.receiverSep12Type,
      });

      // Show form to collect input data for fields
      log.instruction({
        title:
          "To collect the required information we show a form with all the requested fields from /info",
      });

      return {
        assetCode,
        assetIssuer,
        token,
        fields: {
          transaction: infoResponse.fields.transaction,
          sender: sep12Fields.senderSep12Fields,
          receiver: sep12Fields.receiverSep12Fields,
        },
        senderSep12Type: infoResponse.senderSep12Type,
        receiverSep12Type: infoResponse.receiverSep12Type,
        senderSep12Memo: sep12Fields.info.senderSep12Memo,
        receiverSep12Memo: sep12Fields.info.receiverSep12Memo,
        authEndpoint: tomlResponse.authEndpoint,
        sendServer: tomlResponse.sendServer,
        kycServer: tomlResponse.kycServer,
      };
    } catch (error) {
      log.error({
        title: error.toString(),
      });

      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

interface SubmitSendSep31TransactionActionProps {
  amount: { amount: string };
  transaction: AnyObject;
  sender: AnyObject;
  receiver: AnyObject;
}

export const submitSendSep31TransactionAction = createAsyncThunk<
  boolean,
  SubmitSendSep31TransactionActionProps,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendSep31/submitSendSep31TransactionAction",
  async (
    { amount, transaction, sender, receiver },
    { rejectWithValue, getState },
  ) => {
    try {
      const { secretKey } = accountSelector(getState());
      const { data } = sendSep31Selector(getState());
      const { pubnet } = settingsSelector(getState());
      const networkConfig = getNetworkConfig(pubnet);
      const {
        token,
        assetCode,
        assetIssuer,
        kycServer,
        sendServer,
        senderSep12Memo,
        receiverSep12Memo,
        fields,
      } = data;

      // Put SEP-12 fields
      log.instruction({
        title: "Make PUT /customer requests for sending and receiving user",
      });

      log.instruction({ title: "Form data", body: { sender, receiver } });

      const putSep12FieldsResponse = await putSep12Fields({
        fields,
        formData: { sender, receiver },
        secretKey,
        senderSep12Memo,
        receiverSep12Memo,
        kycServer,
        token,
      });

      // Post transaction
      const postResponse = await postTransaction({
        amount: amount.amount,
        assetCode,
        senderId: putSep12FieldsResponse.senderSep12Id,
        receiverId: putSep12FieldsResponse.receiverSep12Id,
        transactionFormData: transaction,
        sendServer,
        token,
      });

      // Poll transaction until ready
      await pollTransactionUntilReady({
        sendServer,
        transactionId: postResponse.transactionId,
        token,
      });

      // Send payment
      await sendPayment({
        amount: amount.amount,
        assetCode,
        assetIssuer,
        receiverAddress: postResponse.receiverAddress,
        secretKey,
        sendMemo: postResponse.sendMemo,
        sendMemoType: postResponse.sendMemoType,
        networkUrl: networkConfig.url,
        networkPassphrase: networkConfig.network,
      });

      // Poll transaction until complete
      await pollTransactionUntilComplete({
        sendServer,
        transactionId: postResponse.transactionId,
        token,
      });

      log.instruction({
        title: "Transaction complete",
      });

      return true;
    } catch (error) {
      log.error({
        title: error.toString(),
      });

      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

const initialState: SendSep31InitialState = {
  data: {
    assetCode: "",
    assetIssuer: "",
    token: "",
    fields: {
      transaction: {},
      sender: {},
      receiver: {},
    },
    senderSep12Type: "",
    receiverSep12Type: "",
    senderSep12Memo: "",
    receiverSep12Memo: "",
    authEndpoint: "",
    sendServer: "",
    kycServer: "",
  },
  errorString: undefined,
  status: undefined,
};

const sendSep31Slice = createSlice({
  name: "sendSep31",
  initialState,
  reducers: {
    resetSendSep31Action: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSendFieldsAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchSendFieldsAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.NEEDS_INPUT;
    });
    builder.addCase(fetchSendFieldsAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      submitSendSep31TransactionAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(submitSendSep31TransactionAction.fulfilled, (state) => {
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(
      submitSendSep31TransactionAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sendSep31Selector = (state: RootState) => state.sendSep31;

export const { reducer } = sendSep31Slice;
export const { resetSendSep31Action } = sendSep31Slice.actions;
