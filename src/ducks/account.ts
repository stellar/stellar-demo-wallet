import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DataProvider, Types } from "@stellar/wallet-sdk";
import { Keypair } from "stellar-sdk";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getAssetData } from "helpers/getAssetData";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
  Asset,
  RejectMessage,
  AccountInitialState,
} from "types/types.d";

interface UnfundedAccount extends Types.AccountDetails {
  id: string;
}

interface AccountKeyPair {
  publicKey: string;
  secretKey: string;
}

interface AccountActionBaseResponse {
  data: Types.AccountDetails | UnfundedAccount;
  assets: {
    [key: string]: Asset;
  };
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
  async ({ publicKey, secretKey }, { rejectWithValue, getState }) => {
    log.instruction({ title: "Getting account info" });

    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);

    const dataProvider = new DataProvider({
      serverUrl: networkConfig.url,
      accountOrKey: publicKey,
      networkPassphrase: networkConfig.network,
    });

    let stellarAccount: Types.AccountDetails | null = null;
    let assets = {};
    let isUnfunded = false;

    log.request({
      title: `Fetching account info`,
      body: `Public key: ${publicKey}`,
    });

    try {
      stellarAccount = await dataProvider.fetchAccountDetails();
      assets = await getAssetData({
        balances: stellarAccount.balances,
        networkUrl: networkConfig.url,
      });
    } catch (error) {
      if (error.isUnfunded) {
        log.instruction({ title: `Account is not funded` });
        stellarAccount = {
          id: publicKey,
        } as UnfundedAccount;
        isUnfunded = true;
      } else {
        log.error({
          title: `Fetching account ${publicKey} failure`,
          body: getErrorString(error),
        });

        return rejectWithValue({
          errorString: getErrorString(error),
        });
      }
    }

    log.response({
      title: `Account info fetched`,
      body: stellarAccount,
    });

    return { data: stellarAccount, assets, isUnfunded, secretKey };
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
      body: error.toString(),
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
>(
  "account/fundTestnetAccount",
  async (publicKey, { rejectWithValue, getState }) => {
    log.instruction({
      title: "The friendbot is starting to fund your testnet account",
    });

    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);

    const dataProvider = new DataProvider({
      serverUrl: networkConfig.url,
      accountOrKey: publicKey,
      networkPassphrase: networkConfig.network,
    });

    try {
      await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      const stellarAccount = await dataProvider.fetchAccountDetails();
      const assets = await getAssetData({
        balances: stellarAccount.balances,
        networkUrl: networkConfig.url,
      });

      log.response({
        title: "The friendbot funded your account",
        body: stellarAccount,
      });

      return { data: stellarAccount, assets, isUnfunded: false };
    } catch (error) {
      log.error({
        title: "The friendbot funding failed",
        body: error.toString(),
      });

      return rejectWithValue({
        errorString:
          "Something went wrong funding the account, please try again.",
      });
    }
  },
);

const initialState: AccountInitialState = {
  data: null,
  assets: {},
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
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAccountAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchAccountAction.fulfilled, (state, action) => {
      state.data = action.payload.data;
      state.assets = action.payload.assets;
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
      state.assets = action.payload.assets;
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
export const { resetAccountAction } = accountSlice.actions;
