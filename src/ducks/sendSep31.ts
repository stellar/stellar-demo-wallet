import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";

import { checkToml } from "methods/sep31Send/checkToml";
import { checkInfo } from "methods/sep31Send/checkInfo";
import { start } from "methods/sep10Auth/start";
import { sign } from "methods/sep10Auth/sign";
import { send } from "methods/sep10Auth/send";
import { getSep12Fields } from "methods/sep31Send/getSep12Fields";
import { putSep12Fields } from "methods/sep31Send/putSep12Fields";
import { postTransaction } from "methods/sep31Send/postTransaction";

import { ActionStatus, RejectMessage } from "types/types.d";

export const fetchSendFieldsAction = createAsyncThunk<
  // TODO: any types
  any,
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendSep31/fetchSendFieldsAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    try {
      const { homeDomain, pubnet } = settingsSelector(getState());
      const { secretKey } = accountSelector(getState());
      const networkConfig = getNetworkConfig(pubnet);

      // checkToml
      log.instruction({ title: "Initiate a direct payment request" });

      const tomlResponse = await checkToml({ homeDomain, pubnet });
      const { authEndpoint, sendServer, kycServer } = tomlResponse;

      // TODO: remove once used
      console.log("kycServer: ", kycServer);

      // checkInfo
      log.instruction({
        title: "Check /info endpoint to see if we need to authenticate",
      });

      // TODO: remove once used
      console.log("assetIssuer: ", assetIssuer);
      const infoResponse = await checkInfo({ assetCode, sendServer });

      // SEP-10 start
      log.instruction({
        title:
          "Start the SEP-0010 flow to authenticate the sending anchor's Stellar account",
      });

      const challengeTransaction = await start({
        authEndpoint,
        secretKey,
      });

      // SEP-10 sign
      log.instruction({
        title:
          "We've received a challenge transaction from the server that we need the sending anchor to sign with their Stellar private key.",
      });

      const signedChallengeTransaction = sign({
        secretKey,
        networkPassphrase: networkConfig.network,
        challengeTransaction,
      });

      // SEP-10 send
      log.instruction({
        title:
          "We need to send the signed SEP10 challenge back to the server to get a JWT token to authenticate our stellar account with future actions",
      });

      const token = await send({ authEndpoint, signedChallengeTransaction });
      console.log("token: ", token);

      // Get SEP-12 fields
      log.instruction({
        title: "Make GET /customer requests for sending and receiving user",
      });
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
        toml: tomlResponse,
        info: {
          ...infoResponse,
          token,
          assetCode,
          ...sep12Fields.info,
        },
        sep12Fields: {
          senderSep12Fields: sep12Fields.senderSep12Fields,
          receiverSep12Fields: sep12Fields.receiverSep12Fields,
        },
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

export const submitSendSep31TransactionAction = createAsyncThunk<
  // TODO: any types
  any,
  any,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendSep31/submitSendSep31TransactionAction",
  async ({ formData }, { rejectWithValue, getState }) => {
    try {
      const { secretKey } = accountSelector(getState());
      const { info, sep12Fields, toml } = sendSep31Selector(getState());

      // Put SEP-12 fields
      log.instruction({
        title: "Make PUT /customer requests for sending and receiving user",
      });

      log.instruction({ title: "Form data", body: formData });

      const putSep12FieldsResponse = await putSep12Fields({
        secretKey,
        formData,
        senderSep12Memo: info.senderSep12Memo,
        receiverSep12Memo: info.receiverSep12Memo,
        kycServer: toml.kycServer,
        sep12Fields,
        token: info.token,
      });

      console.log("putSep12FieldsResponse: ", putSep12FieldsResponse);

      // Post transaction
      const postResponse = await postTransaction({
        token: info.token,
        sendServer: toml.sendServer,
        senderId: putSep12FieldsResponse.senderSep12Id,
        receiverId: putSep12FieldsResponse.receiverSep12Id,
        transactionFormData: formData.transaction,
        assetCode: info.assetCode,
        amount: formData.amount.amount,
      });

      console.log("postResponse: ", postResponse);

      return {
        postResponse,
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

// TODO: any type
const initialState: any = {
  info: {
    fields: null,
    senderSep12Type: "",
    receiverSep12Type: "",
  },
  toml: {
    authEndpoint: "",
    sendServer: "",
    kycServer: "",
  },
  sep12Fields: {
    senderSep12Fields: null,
    receiverSep12Fields: null,
  },
  response: null,
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
      state.toml = action.payload.toml;
      state.info = action.payload.info;
      state.sep12Fields = action.payload.sep12Fields;
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
    builder.addCase(
      submitSendSep31TransactionAction.fulfilled,
      (state, action) => {
        state.response = action.payload;
        state.status = ActionStatus.SUCCESS;
      },
    );
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
