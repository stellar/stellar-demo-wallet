import { Horizon } from "stellar-sdk";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getErrorString } from "helpers/getErrorString";
import { log } from "helpers/log";
import { getToml } from "methods/getToml";
import { revisePaymentTransaction } from "methods/sep8Send/revisePaymentTransaction";
import { submitRevisedTransaction } from "methods/sep8Send/submitRevisedTransaction";
import {
  ActionRequiredParams,
  ActionStatus,
  Asset,
  RejectMessage,
  Sep8ActionRequiredResult,
  Sep8ApprovalResponse,
  Sep8ApprovalStatus,
  Sep8PaymentTransactionParams,
  Sep8SendInitialState,
} from "types/types.d";
import { sendActionRequiredFields } from "methods/sep8Send/sendActionRequiredFields";

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
  Sep8ApprovalResponse,
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
    const { amount, destination, revisedTxXdr } = data.revisedTransaction;

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

export const sep8SendActionRequiredParamsAction = createAsyncThunk<
  Sep8ActionRequiredResult,
  ActionRequiredParams,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8SendActionRequiredParamsAction",
  async (params, { rejectWithValue }) => {
    const { actionFields, actionMethod, actionUrl } = params;

    try {
      const result = await sendActionRequiredFields({
        actionFields,
        actionMethod,
        actionUrl,
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
    sep8Step: undefined,
    approvalCriteria: "",
    approvalServer: "",
    assetCode: "",
    assetIssuer: "",
    homeDomain: "",
    isRegulated: false,
    revisedTransaction: {
      amount: "",
      destination: "",
      submittedTxXdr: "",
      revisedTxXdr: "",
    },
    actionRequiredInfo: {
      actionFields: [],
      actionMethod: "",
      actionUrl: "",
      message: "",
    },
    actionRequiredResult: {
      result: "",
      nextUrl: undefined,
      message: undefined,
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
    sep8ClearErrorAction: (state) => ({ ...state, errorString: undefined }),
  },
  extraReducers: (builder) => {
    builder.addCase(initiateSep8SendAction.pending, (state = initialState) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initiateSep8SendAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.errorString = undefined;
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
      state.errorString = undefined;

      switch (action.payload.status) {
        case Sep8ApprovalStatus.ACTION_REQUIRED: {
          state.status = ActionStatus.CAN_PROCEED;

          const hasDataChanges =
            !!action.payload.actionRequiredInfo ||
            !!state.data.actionRequiredInfo;
          if (!hasDataChanges) {
            break;
          }

          const actionRequiredInfo =
            action.payload.actionRequiredInfo ?? state.data.actionRequiredInfo;
          const revisedTransaction =
            action.payload.revisedTransaction ?? state.data.revisedTransaction;
          state.data = {
            ...state.data,
            actionRequiredInfo,
            revisedTransaction,
          };
          break;
        }

        case Sep8ApprovalStatus.PENDING:
          state.status = ActionStatus.NEEDS_INPUT;
          break;

        case Sep8ApprovalStatus.REVISED:
        case Sep8ApprovalStatus.SUCCESS:
          state.status = ActionStatus.CAN_PROCEED;
          if (action.payload.revisedTransaction) {
            state.data = {
              ...state.data,
              revisedTransaction: action.payload.revisedTransaction,
            };
          }
          break;

        default:
          state.errorString = `The SEP-8 flow for "${action.payload.status}" status is not supported yet.`;
          break;
      }
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
      state.errorString = undefined;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(
      sep8SubmitRevisedTransactionAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );

    builder.addCase(
      sep8SendActionRequiredParamsAction.pending,
      (state = initialState) => {
        state.errorString = undefined;
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(
      sep8SendActionRequiredParamsAction.fulfilled,
      (state, action) => {
        state.data = { ...state.data, actionRequiredResult: action.payload };
        state.errorString = undefined;
        state.status = ActionStatus.SUCCESS;
      },
    );
    builder.addCase(
      sep8SendActionRequiredParamsAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sep8SendSelector = (state: RootState) => state.sep8Send;

export const { reducer } = sep8SendSlice;
export const {
  resetSep8SendAction,
  sep8ClearErrorAction,
} = sep8SendSlice.actions;
