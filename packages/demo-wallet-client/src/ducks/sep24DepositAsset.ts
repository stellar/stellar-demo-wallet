import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { clientDomain, RootState, walletBackendEndpoint } from "config/store";
import { settingsSelector } from "ducks/settings";
import { custodialSelector } from "ducks/custodial";
import { extraSelector } from "ducks/extra";
import {
  getErrorMessage,
} from "demo-wallet-shared/build/helpers/getErrorMessage";
import {
  getNetworkConfig,
} from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  createPopup,
  interactiveDepositFlow,
  pollDepositUntilComplete,
} from "demo-wallet-shared/build/methods/sep24";
import {
  getFromToml,
} from "demo-wallet-shared/build/methods/checkTomlForFields";
import { trustAsset } from "demo-wallet-shared/build/methods/trustAsset";
import {
  ActionStatus,
  AnchorActionType,
  Asset,
  RejectMessage,
  Sep24DepositAssetInitialState,
} from "types/types";
import { getUnifiedAccountData } from "helpers/accountUtils";
import { authenticateWithSep10, authenticateWithSep45 } from "./authUtils";
import { TomlFields } from "demo-wallet-shared/build/types/types";

export const depositAssetAction = createAsyncThunk<
  { currentStatus: string; trustedAssetAdded?: string },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24DepositAsset/depositAssetAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    const networkConfig = getNetworkConfig();
    const sep24TransferServerUrl = await getFromToml({
      assetIssuer,
      homeDomain,
      networkUrl: networkConfig.url,
      requiredKey: TomlFields.TRANSFER_SERVER_SEP0024,
    });

    const { sep9Fields, memo } = extraSelector(getState());
    const unifiedAccount = getUnifiedAccountData(getState());
    if (!unifiedAccount) {
      throw new Error("No valid account found.");
    }

    try {
      if (unifiedAccount.accountType === 'classic') {
        // Regular account - use SEP-10 authentication
        const { publicKey, secretKey } = unifiedAccount;
        if (!publicKey || !secretKey) {
          throw new Error("Public key and secret key are required for SEP-24 deposit.");
        }

        const { claimableBalanceSupported } = settingsSelector(getState());
        const { isEnabled: custodialIsEnabled } = custodialSelector(getState());

        // SEP-10 start
        const token = await authenticateWithSep10(
          AnchorActionType.DEPOSIT,
          assetCode,
          assetIssuer,
          clientDomain,
          homeDomain,
          publicKey,
          [
            TomlFields.SIGNING_KEY,
            TomlFields.TRANSFER_SERVER_SEP0024,
            TomlFields.WEB_AUTH_ENDPOINT,
          ],
          secretKey,
          "SEP-24 deposit",
          getState(),
          walletBackendEndpoint,
        )

        const trustAssetCallback = async () => {
          const assetString = `${assetCode}:${assetIssuer}`;

          await trustAsset({
            secretKey,
            networkPassphrase: networkConfig.network,
            networkUrl: networkConfig.url,
            untrustedAsset: {
              assetString,
              assetCode,
              assetIssuer,
            },
          });

          return assetString;
        };

        const generatedMemoId = custodialIsEnabled
          ? Math.floor(Math.random() * 100).toString()
          : undefined;

        // Interactive flow
        const interactiveResponse = await interactiveDepositFlow({
          assetCode,
          publicKey,
          sep24TransferServerUrl,
          token,
          claimableBalanceSupported,
          memo: memo?.memo || generatedMemoId,
          memoType: custodialIsEnabled || memo?.memo ? "id" : undefined,
          sep9Fields,
        });

        // Create popup
        const popup = createPopup(interactiveResponse.url);

        // Poll transaction until complete
        const { currentStatus, trustedAssetAdded } =
          await pollDepositUntilComplete({
            popup,
            transactionId: interactiveResponse.id,
            token,
            sep24TransferServerUrl,
            trustAssetCallback,
            custodialMemoId: generatedMemoId,
            sep9Fields,
          });

        return {
          currentStatus,
          trustedAssetAdded,
        };

      } else {
        // Contract account - use contract authentication
        const { contractId } = unifiedAccount;
        if (!contractId) {
          throw new Error("Contract ID is required for SEP-24 deposit.");
        }

        // SEP-45 start
        const token = await authenticateWithSep45(
          AnchorActionType.DEPOSIT,
          assetCode,
          assetIssuer,
          contractId,
          clientDomain,
          homeDomain,
          [
            TomlFields.SIGNING_KEY,
            TomlFields.TRANSFER_SERVER_SEP0024,
            TomlFields.WEB_AUTH_CONTRACT_ID,
            TomlFields.WEB_AUTH_FOR_CONTRACTS_ENDPOINT,
          ],
          "SEP-24 deposit",
          walletBackendEndpoint,
        )

        // Interactive flow
        const interactiveResponse = await interactiveDepositFlow({
          assetCode,
          publicKey: contractId!,
          sep24TransferServerUrl,
          token,
          claimableBalanceSupported: false,
          sep9Fields,
        });

        // Create popup
        const popup = createPopup(interactiveResponse.url);

        // Poll transaction until complete
        const { currentStatus, trustedAssetAdded } =
          await pollDepositUntilComplete({
            popup,
            transactionId: interactiveResponse.id,
            token,
            sep24TransferServerUrl,
            sep9Fields,
          });

        return {
          currentStatus,
          trustedAssetAdded,
        };
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-24 deposit failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: Sep24DepositAssetInitialState = {
  data: {
    currentStatus: "",
    trustedAssetAdded: undefined,
  },
  status: undefined,
  errorString: undefined,
};

const sep24DepositAssetSlice = createSlice({
  name: "sep24DepositAsset",
  initialState,
  reducers: {
    resetSep24DepositAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(depositAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(depositAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(depositAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = sep24DepositAssetSlice;
export const { resetSep24DepositAssetAction } = sep24DepositAssetSlice.actions;
