import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getErrorString } from "helpers/getErrorString";
import { log } from "helpers/log";
import { getToml } from "methods/getToml";
import { approvePaymentTransaction } from "methods/sep8Send/approvePaymentTransaction";
import { submitApprovedTransaction } from "methods/sep8Send/submitApprovedTransaction";
import { Horizon } from "stellar-sdk";
import {
  ActionStatus,
  Asset,
  RejectMessage,
  ReviseTransaction,
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

export const sep8ReviseTransaction = createAsyncThunk<
  ReviseTransaction,
  Sep8PaymentTransactionParams,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8ReviseTransaction",
  async (params, { rejectWithValue, getState }) => {
    const { pubnet: isPubnet } = settingsSelector(getState());

    try {
      const result = await approvePaymentTransaction({
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

export const sep8SubmitRevisedTransaction = createAsyncThunk<
  Horizon.TransactionResponse,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8SubmitRevisedTransaction",
  async (_, { rejectWithValue, getState }) => {
    const { pubnet: isPubnet, secretKey } = settingsSelector(getState());
    const {
      data: {
        reviseTransaction: { revisedTxXdr },
      },
    } = sep8SendSelector(getState());
    if (!revisedTxXdr) {
      throw new Error(
        "Unexpectedly found a null value for revised transaction.",
      );
    }

    try {
      const result = await submitApprovedTransaction({
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
      submittedTxXdr: undefined,
      revisedTxXdr: undefined,
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

    builder.addCase(sep8ReviseTransaction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep8ReviseTransaction.fulfilled, (state, action) => {
      state.status = ActionStatus.CAN_PROCEED;
      state.data.reviseTransaction = action.payload;
    });
    builder.addCase(sep8ReviseTransaction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep8SubmitRevisedTransaction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep8SubmitRevisedTransaction.fulfilled, (state) => {
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(sep8SubmitRevisedTransaction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sep8SendSelector = (state: RootState) => state.sep8Send;

export const { reducer } = sep8SendSlice;
export const { resetSep8SendAction } = sep8SendSlice.actions;
