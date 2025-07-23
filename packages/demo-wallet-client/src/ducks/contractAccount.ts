import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ContractAccountDetails,
  ContractAccountState,
  RejectMessage,
} from "../types/types";
import { RootState } from "../config/store";
import { log } from "demo-wallet-shared/build/helpers/log";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { SmartWalletService } from "../services/SmartWalletService";
import { ActionStatus } from "../types/types";
import {
  fetchContractAccountInfo,
} from "../helpers/fetchContractAccountDetails";
import {
  getErrorString
} from "demo-wallet-shared/build/helpers/getErrorString";

const initialState: ContractAccountState = {
  status: undefined,
  contractId: "",
  data: null,
  keyId: "",
  isAuthenticated: false,
  error: null,
};

export const createPasskeyContract = createAsyncThunk<
  { contractId: string; keyId: string; },
  string,
  { rejectValue: RejectMessage; state: RootState }
>("contractAccount/createPasskeyContract", async (passkeyName, { rejectWithValue }) => {
  try {
    log.instruction({ title: "Deploying new contract" });
    const swService = SmartWalletService.getInstance();
    const { contractId, pkId } = await swService.createPasskeyContract(passkeyName);
    log.instruction({ title: "Funding contract" });
    await swService.fundContractWithXLM(contractId);
    return {
      contractId,
      keyId: pkId,
    };
  } catch (error) {
    log.error({
      title: "Deploying contract failed",
      body: getErrorMessage(error),
    });
    return rejectWithValue({
      errorString:
        "Something went wrong while creating contract account, please try again.",
    });
  }
});

export const connectPasskeyContract = createAsyncThunk<
  { contractId: string; keyId: string; },
  void,
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAccount/connectPasskeyContract",
  async (_, { rejectWithValue }) => {
    try {
      log.instruction({ title: "Connecting contract" });
      const swService = SmartWalletService.getInstance();
      const { contractId, pkId } = await swService.connectPasskeyContract();
      return {
        contractId,
        keyId: pkId,
      };
    } catch (error) {
      log.error({
        title: "Connecting contract failed",
        body: getErrorMessage(error),
      });
      return rejectWithValue({
        errorString:
          "Something went wrong while connecting account, please try again.",
      });
    }
  }
);

export const fetchContractAccountAction = createAsyncThunk<
  ContractAccountDetails,
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAccount/fetchContractAccountAction",
  async (contractId, { rejectWithValue }) => {
    log.request({
      title: `Fetching contract info`,
      body: `Contract ID: ${contractId}`,
    });
    try {
      const contractAccount = await fetchContractAccountInfo(contractId);
      log.response({
        title: `Contract info fetched`,
        body: contractAccount,
      });
      return contractAccount;
    } catch (error) {
      log.error({
        title: `Fetching contract failed`,
        body: getErrorString(error),
      });
      return rejectWithValue({
        errorString: getErrorString(error),
      });
    }
  },
);

const contractAccountSlice = createSlice({
  name: "contractAccount",
  initialState,
  reducers: {
    resetContractAccount: () => initialState,
    resetContractAccountStatus: (state) => {
      state.status = undefined;
    },
    updateContractAccount: (
      state,
      action: PayloadAction<Partial<ContractAccountState>>
    ) => ({
      ...state,
      ...action.payload,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPasskeyContract.pending, (state) => {
        state.status = ActionStatus.PENDING;
        state.error = null;
      })
      .addCase(createPasskeyContract.fulfilled, (state, action) => {
        state.status = ActionStatus.SUCCESS;
        state.contractId = action.payload.contractId;
        state.keyId = action.payload.keyId;
      })
      .addCase(createPasskeyContract.rejected, (state, action) => {
        state.status = ActionStatus.ERROR;
        state.error = action.payload?.errorString || "Unknown error occurred";
      })
      .addCase(connectPasskeyContract.pending, (state) => {
        state.status = ActionStatus.PENDING;
        state.error = null;
      })
      .addCase(connectPasskeyContract.fulfilled, (state, action) => {
        state.status = ActionStatus.SUCCESS;
        state.contractId = action.payload.contractId;
        state.keyId = action.payload.keyId;
      })
      .addCase(connectPasskeyContract.rejected, (state, action) => {
        state.status = ActionStatus.ERROR;
        state.error = action.payload?.errorString || "Unknown error occurred";
      })
      .addCase(fetchContractAccountAction.pending, (state = initialState) => {
        state.status = ActionStatus.PENDING;
      })
      .addCase(fetchContractAccountAction.fulfilled, (state, action) => {
        state.status = ActionStatus.SUCCESS;
        state.contractId = action.payload.contract;
        state.data = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchContractAccountAction.rejected, (state, action) => {
        state.status = ActionStatus.ERROR;
        state.error = action.payload?.errorString || "Unknown error occurred";
      });
  },
});

export const { resetContractAccount, resetContractAccountStatus, updateContractAccount } =
  contractAccountSlice.actions;

export const contractAccountSelector = (state: RootState) => state.contractAccount;

export const { reducer } = contractAccountSlice;
