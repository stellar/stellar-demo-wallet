import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getErrorString } from "helpers/getErrorString";
import { log } from "helpers/log";
import { getToml } from "methods/getToml";
import { revisePaymentTransaction } from "methods/sep8Send/revisePaymentTransaction";
import { submitRevisedTransaction } from "methods/sep8Send/submitRevisedTransaction";
import { Horizon } from "stellar-sdk";
import {
  ActionStatus,
  Asset,
  RejectMessage,
  Sep8RevisedTransactionInfo,
  Sep8PaymentTransactionParams,
  Sep8SendInitialState,
} from "types/types.d";

interface InitiateSep8SendActionResponse {
  approvalCriteria: string;
  approvalServer: string;
  assetCode: string;
  assetIssuer: string;
  homeDomain: string;
  isRegulated: boolean;
}

export const initiateSep8SendAction = createAsyncThunk<
  InitiateSep8SendActionResponse,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>("sep8Send/initiateSep8SendAction", async (asset, { rejectWithValue }) => {
  const { assetCode, assetIssuer, homeDomain } = asset;

  try {
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    const tomlResponse = await getToml(homeDomain);
    const currency = (tomlResponse.CURRENCIES as any[]).find(
      (c) => c.code === assetCode && c.issuer === assetIssuer,
    );
    if (!currency) {
      throw new Error(
        "Couldn't find the desired asset in the anchor toml file.",
      );
    }

    const {
      approval_criteria: approvalCriteria,
      approval_server: approvalServer,
      regulated: isRegulated,
    } = currency;

    if (!approvalCriteria) {
      throw new Error(
        "The anchor toml file does not contain an approval criteria.",
      );
    }

    if (!approvalServer) {
      throw new Error(
        "The anchor toml file does not contain an approval server.",
      );
    }

    // this is unlikely
    if (!isRegulated) {
      throw new Error(
        'The anchor toml file does not specify this asset as "regulated".',
      );
    }

    return {
      approvalCriteria,
      approvalServer,
      assetCode,
      assetIssuer,
      homeDomain,
      isRegulated,
    };
  } catch (error) {
    const errorString = getErrorMessage(error);
    log.error({
      title: errorString,
    });
    return rejectWithValue({ errorString });
  }
});

export const sep8ReviseTransactionAction = createAsyncThunk<
  Sep8RevisedTransactionInfo,
  Sep8PaymentTransactionParams,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8ReviseTransactionAction",
  async (params, { rejectWithValue, getState }) => {
    const { pubnet: isPubnet } = settingsSelector(getState());

    try {
      const result = await revisePaymentTransaction({
        params,
        isPubnet,
      });
      return result;
    } catch (error) {
      const errorString = getErrorString(error);
      log.error({ title: errorString });
      return rejectWithValue({ errorString });
    }
  },
);

export const sep8SubmitRevisedTransactionAction = createAsyncThunk<
  Horizon.TransactionResponse,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8SubmitRevisedTransactionAction",
  async (_, { rejectWithValue, getState }) => {
    const { pubnet: isPubnet, secretKey } = settingsSelector(getState());
    const { data } = sep8SendSelector(getState());
    const { amount, destination, revisedTxXdr } = data.reviseTransaction;

    try {
      const result = await submitRevisedTransaction({
        amount,
        destination,
        assetCode: data.assetCode,
        revisedTxXdr,
        isPubnet,
        secretKey,
      });
      return result;
    } catch (error) {
      const errorString = getErrorString(error);
      log.error({ title: errorString });
      return rejectWithValue({ errorString });
    }
  },
);

const initialState: Sep8SendInitialState = {
  data: {
    approvalCriteria: "",
    approvalServer: "",
    assetCode: "",
    assetIssuer: "",
    homeDomain: "",
    isRegulated: false,
    reviseTransaction: {
      amount: "",
      destination: "",
      submittedTxXdr: "",
      revisedTxXdr: "",
    },
  },
  errorString: undefined,
  status: undefined,
};

const sep8SendSlice = createSlice({
  name: "sep8Send",
  initialState,
  reducers: {
    resetSep8SendAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(initiateSep8SendAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initiateSep8SendAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status = ActionStatus.CAN_PROCEED;
    });
    builder.addCase(initiateSep8SendAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep8ReviseTransactionAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep8ReviseTransactionAction.fulfilled, (state, action) => {
      state.status = ActionStatus.CAN_PROCEED;
      state.data.reviseTransaction = action.payload;
    });
    builder.addCase(sep8ReviseTransactionAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep8SubmitRevisedTransactionAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep8SubmitRevisedTransactionAction.fulfilled, (state) => {
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(
      sep8SubmitRevisedTransactionAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sep8SendSelector = (state: RootState) => state.sep8Send;

export const { reducer } = sep8SendSlice;
export const { resetSep8SendAction } = sep8SendSlice.actions;
