import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StellarSdk, {
  Account,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { trustAsset } from "methods/trustAsset";
import {
  ActionStatus,
  ClaimAssetInitialState,
  CleanedClaimableBalanceRecord,
  RejectMessage,
} from "types/types.d";

export const claimAssetAction = createAsyncThunk<
  { result: any },
  CleanedClaimableBalanceRecord,
  { rejectValue: RejectMessage; state: RootState }
>(
  "claimAsset/claimAssetAction",
  async (balance, { rejectWithValue, getState }) => {
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());

    const networkConfig = getNetworkConfig(pubnet);
    const server = new StellarSdk.Server(networkConfig.url);
    const [assetCode, assetIssuer] = balance.asset.split(":");

    try {
      if (data?.balances && !data?.balances[balance.asset]) {
        // TODO: log this
        console.log("instruction: ", "Adding trustline...");
        try {
          await trustAsset({
            server,
            secretKey,
            networkPassphrase: networkConfig.network,
            untrustedAsset: {
              assetString: balance.asset,
              assetCode,
              assetIssuer,
            },
          });
        } catch (error) {
          throw new Error(error);
        }
      }

      // TODO: log this
      console.log(
        "instruction: ",
        `Claiming ${balance.amount} of ${assetCode}`,
        `BalanceId: ${balance.id} Sponsor:${balance.sponsor}`,
      );

      const keypair = Keypair.fromSecret(secretKey);
      const accountRecord = await server
        .accounts()
        .accountId(keypair.publicKey())
        .call();
      // TODO: log this
      console.log(
        "instruction: ",
        "Loading account to get sequence number for claimClaimableBalance transaction",
      );

      const account = new Account(keypair.publicKey(), accountRecord.sequence);
      // TODO: log this
      console.log(
        "instruction: ",
        "Building claimClaimableBalance transaction",
      );

      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: networkConfig.network,
      })
        .addOperation(
          Operation.claimClaimableBalance({
            balanceId: balance.id,
          }),
        )
        .setTimeout(0)
        .build();

      transaction.sign(keypair);

      // TODO: log this
      console.log(
        "request: ",
        "Submitting claimClaimableBalance transaction",
        transaction,
      );

      const result = await server.submitTransaction(transaction);
      // TODO: log this
      console.log(
        "response: ",
        "Submitted claimClaimableBalance transaction",
        result,
      );

      return {
        result,
      };
    } catch (error) {
      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

const initialState: ClaimAssetInitialState = {
  data: {
    result: null,
  },
  status: undefined,
  errorString: undefined,
};

const claimAssetSlice = createSlice({
  name: "claimAsset",
  initialState,
  reducers: {
    resetClaimAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(claimAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(claimAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(claimAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = claimAssetSlice;
export const { resetClaimAssetAction } = claimAssetSlice.actions;
