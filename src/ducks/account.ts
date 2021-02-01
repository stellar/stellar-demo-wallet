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
  isUnfunded: boolean;
}

interface AccountKeyPair {
  publicKey: string;
  secretKey: string;
}

interface FetchAccountActionResponse {
  data: Types.AccountDetails | UnfundedAccount;
  secretKey: string;
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
      serverUrl: getNetworkConfig(Boolean(pubnet)).url,
      accountOrKey: publicKey,
      networkPassphrase: getNetworkConfig(Boolean(pubnet)).network,
    });

    let stellarAccount: Types.AccountDetails | null = null;

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
          isUnfunded: true,
        } as UnfundedAccount;
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

    log.instruction({
      title: `Fetching account ${publicKey} success`,
      body: JSON.stringify(stellarAccount),
    });

    return { data: stellarAccount, secretKey };
  },
);

export const createRandomAccountAndFundIt = createAsyncThunk<
  string,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>("account/createRandomAccountAndFundIt", async (_, { rejectWithValue }) => {
  try {
    const keypair = Keypair.random();
    await fetch(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`);

    return keypair.secret();
  } catch (error) {
    return rejectWithValue({
      errorString: "Something went wrong, please try again.",
    });
  }
});

const initialState: AccountInitialState = {
  data: null,
  errorString: undefined,
  isAuthenticated: false,
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
      state.secretKey = action.payload.secretKey;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchAccountAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      createRandomAccountAndFundIt.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(createRandomAccountAndFundIt.fulfilled, (state, action) => {
      state.secretKey = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(createRandomAccountAndFundIt.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const accountSelector = (state: RootState) => state.account;

export const { reducer } = accountSlice;
export const { resetAccountAction } = accountSlice.actions;
