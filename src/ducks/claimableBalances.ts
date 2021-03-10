import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StellarSdk, { ServerApi } from "stellar-sdk";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
  ClaimableAsset,
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
    const networkConfig = getNetworkConfig(pubnet);
    const server = new StellarSdk.Server(networkConfig.url);

    try {
      const claimableBalanceResponse = await server
        .claimableBalances()
        .claimant(publicKey)
        .call();

      const cleanedRecords: ClaimableAsset[] = [];

      claimableBalanceResponse.records.forEach(
        (record: ServerApi.ClaimableBalanceRecord) => {
          const [assetCode, assetIssuer] = record.asset.split(":");

          const cleanedRecord = {
            id: record.id,
            assetString: record.id,
            assetCode,
            assetIssuer,
            total: record.amount,
            sponsor: record.sponsor,
            lastModifiedLedger: record.last_modified_ledger,
            source: record,
          };

          log.response({
            title: "Claimable Balances Available ",
            body: cleanedRecord,
          });

          cleanedRecords.push(cleanedRecord as ClaimableAsset);
        },
      );

      return {
        records: cleanedRecords,
      };
    } catch (error) {
      return rejectWithValue({
        errorString: getErrorMessage(error),
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
