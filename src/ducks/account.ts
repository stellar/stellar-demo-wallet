import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { DataProvider, Types } from "@stellar/wallet-sdk";
import { Keypair } from "stellar-sdk";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
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

interface FetchAccountActionResponse {
  data: Types.AccountDetails | UnfundedAccount;
  secretKey: string;
  isUnfunded: boolean;
}

export const fetchAccountAction = createAsyncThunk<
  FetchAccountActionResponse,
  AccountKeyPair,
  { rejectValue: RejectMessage; state: RootState }
>(
  "account/fetchAccountAction",
  async ({ publicKey, secretKey }, { rejectWithValue, getState }) => {
    const { pubnet } = settingsSelector(getState());

    log.instruction({ title: `Starting to fetch account ${publicKey}` });

    const dataProvider = new DataProvider({
      serverUrl: getNetworkConfig(pubnet).url,
      accountOrKey: publicKey,
      networkPassphrase: getNetworkConfig(pubnet).network,
    });

    let stellarAccount: Types.AccountDetails | null = null;
    let isUnfunded = false;

    try {
      log.instruction({ title: `Checking if the account is funded` });
      const accountIsFunded = await dataProvider.isAccountFunded();

      if (accountIsFunded) {
        log.instruction({
          title: `Account is funded, fetching account details`,
        });
        stellarAccount = await dataProvider.fetchAccountDetails();
      } else {
        log.instruction({ title: `Account is not funded` });
        stellarAccount = {
          id: publicKey,
        } as UnfundedAccount;
        isUnfunded = true;
      }
    } catch (error) {
      log.error({
        title: `Fetching account ${publicKey} failure`,
        body: error,
      });

      return rejectWithValue({
        errorString: getErrorString(error),
      });
    }

    log.response({
      url: `Account ${publicKey} info fetched`,
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
    const keypair = Keypair.random();
    return keypair.secret();
  } catch (error) {
    return rejectWithValue({
      errorString:
        "Something went wrong while creating random account, please try again.",
    });
  }
});

export const fundTestnetAccount = createAsyncThunk<
  { data: Types.AccountDetails; isUnfunded: boolean },
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "account/fundTestnetAccount",
  async (publicKey, { rejectWithValue, getState }) => {
    const { pubnet } = settingsSelector(getState());

    const dataProvider = new DataProvider({
      serverUrl: getNetworkConfig(pubnet).url,
      accountOrKey: publicKey,
      networkPassphrase: getNetworkConfig(pubnet).network,
    });

    try {
      await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      const stellarAccount = await dataProvider.fetchAccountDetails();

      return { data: stellarAccount, isUnfunded: false };
    } catch (error) {
      return rejectWithValue({
        errorString:
          "Something went wrong funding the account, please try again.",
      });
    }
  },
);

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
export const { resetAccountAction } = accountSlice.actions;
