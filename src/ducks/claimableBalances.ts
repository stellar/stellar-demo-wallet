import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StellarSdk, { ServerApi } from "stellar-sdk";
import { omit } from "lodash";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import {
  ActionStatus,
  CleanedClaimableBalanceRecord,
  ClaimableBalancesInitialState,
  RejectMessage,
} from "types/types.d";

export const fetchClaimableBalancesAction = createAsyncThunk<
  { records: any[] },
  { publicKey: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "claimableBalances/fetchClaimableBalancesAction",
  async ({ publicKey }, { rejectWithValue, getState }) => {
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(Boolean(pubnet));
    const server = new StellarSdk.Server(networkConfig.url);

    try {
      const claimableBalanceResponse = await server
        .claimableBalances()
        .claimant(publicKey)
        .call();

      const cleanedRecords: CleanedClaimableBalanceRecord[] = [];

      claimableBalanceResponse.records.forEach(
        (record: ServerApi.ClaimableBalanceRecord) => {
          const cleanedRecord = omit(record, [
            "_links",
            "paging_token",
            "self",
          ]);
          console.log(
            "response: ",
            "Claimable Balances Available ",
            cleanedRecord,
          );
          cleanedRecords.push(cleanedRecord as CleanedClaimableBalanceRecord);
        },
      );

      return {
        records: cleanedRecords,
      };
    } catch (error) {
      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

const initialState: ClaimableBalancesInitialState = {
  data: {
    records: null,
  },
  errorString: undefined,
  status: undefined,
};

const claimableBalancesSlice = createSlice({
  name: "claimableBalances",
  initialState,
  reducers: {
    resetClaimableBalancesAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchClaimableBalancesAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(fetchClaimableBalancesAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchClaimableBalancesAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const accountSelector = (state: RootState) => state.account;

export const { reducer } = claimableBalancesSlice;
export const { resetClaimableBalancesAction } = claimableBalancesSlice.actions;
