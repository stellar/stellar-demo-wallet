import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Horizon } from "stellar-sdk";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorString } from "demo-wallet-shared/build/helpers/getErrorString";
import { log } from "demo-wallet-shared/build/helpers/log";
import { submitPaymentTransaction } from "demo-wallet-shared/build/methods/submitPaymentTransaction";
import {
  ActionStatus,
  PaymentTransactionParams,
  SendPaymentInitialState,
  RejectMessage,
} from "types/types";

export const sendPaymentAction = createAsyncThunk<
  Horizon.HorizonApi.SubmitTransactionResponse,
  PaymentTransactionParams,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendPayment/sendPaymentAction",
  async (params, { rejectWithValue, getState }) => {
    const { secretKey } = settingsSelector(getState());
    let result;

    try {
      result = await submitPaymentTransaction({
        params,
        secretKey,
      });
    } catch (error) {
      const errorString = getErrorString(error);
      log.error({ title: errorString });
      return rejectWithValue({
        errorString,
      });
    }

    return result;
  },
);

const initialState: SendPaymentInitialState = {
  data: null,
  status: undefined,
  errorString: undefined,
};

const sendPaymentSlice = createSlice({
  name: "sendPayment",
  initialState,
  reducers: {
    resetSendPaymentAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(sendPaymentAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sendPaymentAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(sendPaymentAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = sendPaymentSlice;
export const { resetSendPaymentAction } = sendPaymentSlice.actions;
