import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { accountSelector } from "ducks/account";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { normalizeHomeDomainUrl } from "demo-wallet-shared/build/helpers/normalizeHomeDomainUrl";
import { log } from "demo-wallet-shared/build/helpers/log";

import {
  sep10AuthStart,
  sep10AuthSign,
  sep10AuthSend,
} from "demo-wallet-shared/build/methods/sep10Auth";
import {
  checkInfo,
  getSep12Fields,
  putSep12Fields,
  postTransaction,
  pollTransactionUntilReady,
  sendPayment,
  pollTransactionUntilComplete,
} from "demo-wallet-shared/build/methods/sep31Send";
import { checkTomlForFields } from "demo-wallet-shared/build/methods/checkTomlForFields";
import { Sep31GetTransaction } from "demo-wallet-shared/build/types/types";

import {
  Asset,
  ActionStatus,
  AnyObject,
  CustomerTypeItem,
  Sep31SendInitialState,
  RejectMessage,
  TomlFields,
} from "types/types";

interface InitiateSendActionResponse {
  publicKey: string;
  homeDomain: string;
  assetCode: string;
  assetIssuer: string;
  fields: {
    transaction: AnyObject;
    sender: AnyObject;
    receiver: AnyObject;
  };
  senderType: string | undefined;
  receiverType: string | undefined;
  multipleSenderTypes: CustomerTypeItem[] | undefined;
  multipleReceiverTypes: CustomerTypeItem[] | undefined;
  authEndpoint: string;
  sendServer: string;
  kycServer: string;
  serverSigningKey: string;
  isTypeSelected: boolean;
}

export const initiateSendAction = createAsyncThunk<
  InitiateSendActionResponse,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep31Send/initiateSendAction",
  async (asset, { rejectWithValue, getState }) => {
    try {
      const { data } = accountSelector(getState());
      const networkConfig = getNetworkConfig();
      const publicKey = data?.id;

      const { assetCode, assetIssuer, homeDomain } = asset;

      // This is unlikely
      if (!publicKey) {
        throw new Error("Something is wrong with Account, no public key.");
      }

      // This is unlikely
      if (!homeDomain) {
        throw new Error("Something went wrong, home domain is not defined.");
      }

      log.instruction({ title: "Initiating a SEP-31 direct payment" });

      // Check toml
      const tomlResponse = await checkTomlForFields({
        sepName: "SEP-31 send",
        assetIssuer,
        requiredKeys: [
          TomlFields.WEB_AUTH_ENDPOINT,
          TomlFields.SIGNING_KEY,
          TomlFields.DIRECT_PAYMENT_SERVER,
          TomlFields.KYC_SERVER,
        ],
        networkUrl: networkConfig.url,
        homeDomain,
      });

      const authEndpoint = tomlResponse.WEB_AUTH_ENDPOINT;
      const serverSigningKey = tomlResponse.SIGNING_KEY;
      const sendServer = tomlResponse.DIRECT_PAYMENT_SERVER;
      const kycServer = tomlResponse.KYC_SERVER;

      // Check info
      const infoResponse = await checkInfo({ assetCode, sendServer });

      let anchorQuoteServer;

      // Check SEP-38 quote server key in toml, if supported
      if (infoResponse.quotesSupported) {
        const tomlSep38Response = await checkTomlForFields({
          sepName: "SEP-38 Anchor RFQ",
          assetIssuer,
          requiredKeys: [TomlFields.ANCHOR_QUOTE_SERVER],
          networkUrl: networkConfig.url,
          homeDomain,
        });

        anchorQuoteServer = tomlSep38Response.ANCHOR_QUOTE_SERVER;
      }

      // If there are multiple sender or receiver types the status will be
      // returned NEEDS_INPUT, which will show modal for user to select types.

      return {
        publicKey,
        homeDomain,
        assetCode,
        assetIssuer,
        fields: {
          transaction: infoResponse.fields.transaction,
          sender: {},
          receiver: {},
        },
        senderType: infoResponse.senderType,
        receiverType: infoResponse.receiverType,
        multipleSenderTypes: infoResponse.multipleSenderTypes,
        multipleReceiverTypes: infoResponse.multipleReceiverTypes,
        authEndpoint,
        sendServer,
        kycServer,
        serverSigningKey,
        isTypeSelected: Boolean(
          !infoResponse.multipleSenderTypes &&
            !infoResponse.multipleReceiverTypes,
        ),
        anchorQuoteSupported: infoResponse.quotesSupported,
        anchorQuoteRequired: infoResponse.quotesRequired,
        anchorQuoteServer,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      log.error({
        title: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

interface SetCustomerTypesActionResponse {
  senderType: string | undefined;
  receiverType: string | undefined;
  isTypeSelected: boolean;
}

export const setCustomerTypesAction = createAsyncThunk<
  SetCustomerTypesActionResponse,
  { senderType?: string; receiverType?: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep31Send/setCustomerTypesAction",
  ({ senderType = "", receiverType = "" }) => {
    if (senderType) {
      log.instruction({
        title: `Using \`${senderType}\` type for sending customers`,
      });
    }

    if (receiverType) {
      log.instruction({
        title: `Using \`${receiverType}\` type for receiving customers`,
      });
    }

    return {
      senderType,
      receiverType,
      isTypeSelected: true,
    };
  },
);

interface FetchSendFieldsActionResponse {
  token: string;
  fields: {
    transaction: AnyObject;
    sender: AnyObject;
    receiver: AnyObject;
  };
  senderMemo: string;
  receiverMemo: string;
}

export const fetchSendFieldsAction = createAsyncThunk<
  FetchSendFieldsActionResponse,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep31Send/fetchSendFieldsAction",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { secretKey } = accountSelector(getState());
      const { data } = sep31SendSelector(getState());
      const networkConfig = getNetworkConfig();

      const {
        authEndpoint,
        serverSigningKey,
        publicKey,
        kycServer,
        senderType,
        receiverType,
        fields,
        homeDomain,
      } = data;

      // SEP-10 start
      const challengeTransaction = await sep10AuthStart({
        authEndpoint,
        serverSigningKey,
        publicKey,
        homeDomain: normalizeHomeDomainUrl(homeDomain).host,
        clientDomain,
      });

      // SEP-10 sign
      const signedChallengeTransaction = await sep10AuthSign({
        secretKey,
        networkPassphrase: networkConfig.network,
        challengeTransaction,
        walletBackendEndpoint,
      });

      // SEP-10 send
      const token = await sep10AuthSend({
        authEndpoint,
        signedChallengeTransaction,
      });

      // Get SEP-12 fields
      const sep12Fields = await getSep12Fields({
        kycServer,
        publicKey,
        token,
        senderType,
        receiverType,
      });

      // Show form to collect input data for fields
      log.instruction({
        title:
          "To collect the required information we show a form with all the requested fields from `/info`",
      });

      return {
        token,
        fields: {
          transaction: fields.transaction,
          sender: sep12Fields.senderSep12Fields || {},
          receiver: sep12Fields.receiverSep12Fields || {},
        },
        senderMemo: sep12Fields.info.senderSep12Memo,
        receiverMemo: sep12Fields.info.receiverSep12Memo,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      log.error({
        title: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

interface SubmitSep31SendTransactionActionProps {
  amount: { amount: string };
  transaction: AnyObject;
  sender: AnyObject;
  receiver: AnyObject;
  quoteId?: string;
  destinationAsset?: string;
}

export const submitSep31SendTransactionAction = createAsyncThunk<
  boolean,
  SubmitSep31SendTransactionActionProps,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep31Send/submitSep31SendTransactionAction",
  async (
    { amount, transaction, sender, receiver, quoteId, destinationAsset },
    { rejectWithValue, getState },
  ) => {
    try {
      const { secretKey } = accountSelector(getState());
      const { data } = sep31SendSelector(getState());
      const networkConfig = getNetworkConfig();
      const {
        token,
        assetCode,
        assetIssuer,
        kycServer,
        sendServer,
        senderMemo,
        receiverMemo,
        fields,
      } = data;

      // Put SEP-12 fields
      const putSep12FieldsResponse = await putSep12Fields({
        fields,
        formData: { sender, receiver },
        secretKey,
        senderMemo,
        receiverMemo,
        kycServer,
        token,
      });

      // Post transaction
      const postResponse = await postTransaction({
        amount: amount.amount,
        assetCode,
        senderId: putSep12FieldsResponse.senderSep12Id,
        receiverId: putSep12FieldsResponse.receiverSep12Id,
        // We always need to submit transaction object
        transactionFormData: transaction || {},
        sendServer,
        token,
        quoteId,
        destinationAsset,
      });

      // Poll transaction until ready
      const getSep31Tx: Sep31GetTransaction = await pollTransactionUntilReady({
        sendServer,
        transactionId: postResponse.transactionId,
        token,
      });

      const amountIn = getSep31Tx?.transaction?.amount_in;
      if (amountIn === undefined) {
        throw new Error(
          `"amount_in" is missing from the GET /transaction response`,
        );
      }

      // Send payment
      await sendPayment({
        amount: amountIn,
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
        title: "SEP-31 send payment completed",
      });

      return true;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: Sep31SendInitialState = {
  data: {
    publicKey: "",
    homeDomain: "",
    assetCode: "",
    assetIssuer: "",
    token: "",
    fields: {
      transaction: {},
      sender: {},
      receiver: {},
    },
    isTypeSelected: false,
    senderType: undefined,
    receiverType: undefined,
    senderMemo: "",
    receiverMemo: "",
    multipleSenderTypes: undefined,
    multipleReceiverTypes: undefined,
    authEndpoint: "",
    sendServer: "",
    kycServer: "",
    serverSigningKey: "",
    anchorQuoteSupported: undefined,
    anchorQuoteRequired: undefined,
    anchorQuoteServer: undefined,
  },
  errorString: undefined,
  status: undefined,
};

const sep31SendSlice = createSlice({
  name: "sep31Send",
  initialState,
  reducers: {
    resetSep31SendAction: () => initialState,
    setStatusAction: (state, action) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initiateSendAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initiateSendAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status =
        action.payload.multipleSenderTypes ||
        action.payload.multipleReceiverTypes
          ? ActionStatus.NEEDS_INPUT
          : ActionStatus.CAN_PROCEED;
    });
    builder.addCase(initiateSendAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(setCustomerTypesAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(setCustomerTypesAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status = ActionStatus.CAN_PROCEED;
    });

    builder.addCase(fetchSendFieldsAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchSendFieldsAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status = ActionStatus.NEEDS_INPUT;
    });
    builder.addCase(fetchSendFieldsAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      submitSep31SendTransactionAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(submitSep31SendTransactionAction.fulfilled, (state) => {
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(
      submitSep31SendTransactionAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sep31SendSelector = (state: RootState) => state.sep31Send;

export const { reducer } = sep31SendSlice;
export const { resetSep31SendAction, setStatusAction } = sep31SendSlice.actions;
