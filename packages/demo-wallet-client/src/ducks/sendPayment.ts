import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Horizon, Keypair } from "@stellar/stellar-sdk";
import { Api } from "@stellar/stellar-sdk/rpc";
import { RootState } from "config/store";
import { getErrorString } from "demo-wallet-shared/build/helpers/getErrorString";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  submitPaymentTransaction,
  submitSorobanPaymentTransaction,
} from "demo-wallet-shared/build/methods/submitPaymentTransaction";
import {
  ActionStatus,
  SendPaymentInitialState,
  RejectMessage,
} from "types/types";
import { PaymentTransactionParams } from "demo-wallet-shared/build/types/types";
import { getUnifiedAccountData } from "../helpers/accountUtils";

// Union type to handle both classic account (Horizon) and contract account (RPC) responses
type SendPaymentResponse = Horizon.HorizonApi.SubmitTransactionResponse | Api.GetTransactionResponse;

export const sendPaymentAction = createAsyncThunk<
  SendPaymentResponse,
  { destination: string; isDestinationFunded: boolean; amount: string; assetCode: string; assetIssuer?: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendPayment/sendPaymentAction",
  async ({destination, isDestinationFunded, amount, assetCode, assetIssuer}, { rejectWithValue, getState }) => {
    const unifiedAccount = getUnifiedAccountData(getState())
    if (!unifiedAccount) {
      return rejectWithValue({
        errorString: "No valid account found",
      });
    }

    try {
      if (unifiedAccount.accountType === 'classic' && destination.startsWith('G')) {
        // G to G payment
        const params: PaymentTransactionParams = {
          destination,
          isDestinationFunded,
          amount,
          assetCode,
          assetIssuer,
          publicKey: unifiedAccount.publicKey!,
        }
        return await submitPaymentTransaction({
          params,
          secretKey: unifiedAccount.secretKey!,
        });
      } else {
        // payment involving contract account (either as sender or receiver)
        const signer = unifiedAccount.accountType === 'classic'
          ? Keypair.fromSecret(unifiedAccount.secretKey!)
          : unifiedAccount.contractId!;
        return await submitSorobanPaymentTransaction({
          destination,
          assetCode,
          assetIssuer,
          amount,
          fromAcc: unifiedAccount.identifier,
          signer,
        });
      }
    } catch (error) {
      const errorString = getErrorString(error);
      log.error({ title: errorString });
      return rejectWithValue({
        errorString,
      });
    }
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
