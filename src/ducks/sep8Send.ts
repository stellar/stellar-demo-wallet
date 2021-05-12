import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Horizon } from "stellar-sdk";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getErrorString } from "helpers/getErrorString";
import { log } from "helpers/log";
import { getToml } from "methods/getToml";
import { submitSEP8PaymentTransaction } from "methods/sep8Send/submitSEP8PaymentTransaction";
import {
  ActionStatus,
  Asset,
  RejectMessage,
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

    for (let i = 0; i < tomlResponse.CURRENCIES?.length; i += 1) {
      const currency = tomlResponse.CURRENCIES[i] as any;

      if (currency.code === assetCode && currency.issuer === assetIssuer) {
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

        // This is unlikely
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
      }
    }

    throw new Error("Couldn't find the desired asset in the anchor toml file.");
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    log.error({
      title: errorMessage,
    });
    return rejectWithValue({
      errorString: errorMessage,
    });
  }
});

export const sep8SendPaymentAction = createAsyncThunk<
  Horizon.TransactionResponse,
  Sep8PaymentTransactionParams,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep8Send/sep8SendPaymentAction",
  async (params, { rejectWithValue, getState }) => {
    const { pubnet: isPubnet, secretKey } = settingsSelector(getState());

    try {
      const result = await submitSEP8PaymentTransaction({
        params,
        secretKey,
        isPubnet,
      });
      return result;
    } catch (error) {
      const errorString = getErrorString(error);
      log.error({ title: errorString });
      return rejectWithValue({
        errorString,
      });
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

    builder.addCase(sep8SendPaymentAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep8SendPaymentAction.fulfilled, (state) => {
      // state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(sep8SendPaymentAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sep8SendSelector = (state: RootState) => state.sep8Send;

export const { reducer } = sep8SendSlice;
export const { resetSep8SendAction } = sep8SendSlice.actions;
