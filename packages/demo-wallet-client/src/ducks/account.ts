import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Keypair } from "stellar-sdk";

import { RootState } from "config/store";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getErrorString } from "demo-wallet-shared/build/helpers/getErrorString";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { fetchAccountDetails } from "helpers/fetchAccountDetails";
import {
  ActionStatus,
  RejectMessage,
  AccountInitialState,
  AccountDetails,
} from "types/types";

interface UnfundedAccount extends AccountDetails {
  id: string;
}

interface AccountKeyPair {
  publicKey: string;
  secretKey: string;
}

interface AccountActionBaseResponse {
  data: AccountDetails | UnfundedAccount;
  isUnfunded: boolean;
}

interface FetchAccountActionResponse extends AccountActionBaseResponse {
  secretKey: string;
}

export const fetchAccountAction = createAsyncThunk<
  FetchAccountActionResponse,
  AccountKeyPair,
  { rejectValue: RejectMessage; state: RootState }
>(
  "account/fetchAccountAction",
  async ({ publicKey, secretKey }, { rejectWithValue }) => {
    const networkConfig = getNetworkConfig();

    let stellarAccount: AccountDetails | null = null;
    let isUnfunded = false;

    log.request({
      title: `Fetching account info`,
      body: `Public key: ${publicKey}`,
    });

    try {
      stellarAccount = await fetchAccountDetails(networkConfig.url, publicKey);

      if (!stellarAccount) {
        log.instruction({ title: `Account is not funded` });

        stellarAccount = {
          id: publicKey,
        } as UnfundedAccount;

        isUnfunded = true;
      }
    } catch (e) {
      const errorMessage = getErrorString(e);
      log.error({
        title: `Fetching account \`${publicKey}\` failed`,
        body: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }

    log.response({
      title: `Account info fetched`,
      body: stellarAccount,
    });

    return { data: stellarAccount, isUnfunded, secretKey };
  },
);

export const createRandomAccount = createAsyncThunk<
  string,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>("account/createRandomAccount", (_, { rejectWithValue }) => {
  try {
    log.instruction({ title: "Generating new keypair" });
    const keypair = Keypair.random();
    return keypair.secret();
  } catch (error) {
    log.error({
      title: "Generating new keypair failed",
      body: getErrorMessage(error),
    });
    return rejectWithValue({
      errorString:
        "Something went wrong while creating random account, please try again.",
    });
  }
});

export const fundTestnetAccount = createAsyncThunk<
  AccountActionBaseResponse,
  string,
  { rejectValue: RejectMessage; state: RootState }
>("account/fundTestnetAccount", async (publicKey, { rejectWithValue }) => {
  log.instruction({
    title: "The friendbot is funding testnet account",
    body: `Public key: ${publicKey}`,
  });

  const networkConfig = getNetworkConfig();

  try {
    await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);

    const stellarAccount = await fetchAccountDetails(
      networkConfig.url,
      publicKey,
    );

    if (!stellarAccount) {
      throw Error(`Error fetching account: ${publicKey}`);
    }

    log.response({
      title: "The friendbot funded account",
      body: stellarAccount,
    });

    return { data: stellarAccount, isUnfunded: false };
  } catch (error) {
    log.error({
      title: "The friendbot funding of the account failed",
      body: getErrorMessage(error),
    });

    return rejectWithValue({
      errorString:
        "Something went wrong with funding the account, please try again.",
    });
  }
});

const initialState: AccountInitialState = {
  data: null,
  errorString: undefined,
  isAuthenticated: false,
  isUnfunded: false,
  secretKey: "",
  status: undefined,
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    resetAccountAction: () => initialState,
    resetAccountStatusAction: (state) => {
      state.status = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAccountAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchAccountAction.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.isAuthenticated = Boolean(action.payload.data);
      state.isUnfunded = action.payload.isUnfunded;
      state.secretKey = action.payload.secretKey;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchAccountAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(createRandomAccount.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(createRandomAccount.fulfilled, (state, action) => {
      state.secretKey = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(createRandomAccount.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(fundTestnetAccount.pending, (state) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fundTestnetAccount.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.isUnfunded = action.payload.isUnfunded;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fundTestnetAccount.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const accountSelector = (state: RootState) => state.account;

export const { reducer } = accountSlice;
export const { resetAccountAction, resetAccountStatusAction } =
  accountSlice.actions;
