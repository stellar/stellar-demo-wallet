import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { extraSelector } from "ducks/extra";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  interactiveWithdrawFlow,
  createPopup,
  pollWithdrawUntilComplete,
} from "demo-wallet-shared/build/methods/sep24";
import {
  getFromToml,
} from "demo-wallet-shared/build/methods/checkTomlForFields";
import {
  Asset,
  ActionStatus,
  RejectMessage,
  Sep24WithdrawAssetInitialState,
  TomlFields,
  AnchorActionType,
} from "types/types";
import { getUnifiedAccountData } from "../helpers/accountUtils";
import { authenticateWithSep10, authenticateWithSep45 } from "./authUtils";
import { SOURCE_KEYPAIR_SECRET } from "demo-wallet-shared/constants/soroban";

export const withdrawAssetAction = createAsyncThunk<
  { currentStatus: string },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24WithdrawAsset/withdrawAssetAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetIssuer, assetCode, homeDomain } = asset;
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    const { sep9Fields } = extraSelector(getState());
    const networkConfig = getNetworkConfig();
    const sep24TransferServerUrl = await getFromToml({
      assetIssuer,
      homeDomain,
      networkUrl: networkConfig.url,
      requiredKey: TomlFields.TRANSFER_SERVER_SEP0024,
    });

    const unifiedAccount = getUnifiedAccountData(getState());
    if (!unifiedAccount) {
      throw new Error("No valid account found.");
    }

    try {
      if (unifiedAccount.accountType === 'classic') {
        // Regular account - use SEP-10 authentication
        const { publicKey, secretKey } = unifiedAccount;
        if (!publicKey || !secretKey) {
          throw new Error("Public key and secret key are required for SEP-24 withdraw.");
        }

        // SEP-10 start
        const token = await authenticateWithSep10(
          AnchorActionType.WITHDRAWAL,
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
          "SEP-24 withdrawal",
          getState(),
          walletBackendEndpoint,
        )

        // Interactive flow
        const interactiveResponse = await interactiveWithdrawFlow({
          assetCode,
          publicKey,
          sep24TransferServerUrl,
          token,
          sep9Fields,
        });

        const popup = createPopup(interactiveResponse.url);

        // Poll transaction until complete
        const currentStatus = await pollWithdrawUntilComplete({
          secretKey,
          popup,
          transactionId: interactiveResponse.id,
          token,
          sep24TransferServerUrl,
          networkPassphrase: networkConfig.network,
          networkUrl: networkConfig.url,
          assetCode,
          assetIssuer,
          sep9Fields,
        });

        return {
          currentStatus,
        };
      } else {
        // Contract account - use contract authentication
        const { contractId } = unifiedAccount;
        if (!contractId) {
          throw new Error("Contract ID is required for SEP-24 deposit.");
        }

        // SEP-45 start
        const token = await authenticateWithSep45(
          AnchorActionType.WITHDRAWAL,
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
          "SEP-24 withdrawal",
          walletBackendEndpoint,
        )

        // Interactive flow
        const interactiveResponse = await interactiveWithdrawFlow({
          assetCode,
          publicKey: contractId!,
          sep24TransferServerUrl,
          token,
          sep9Fields,
        });

        const popup = createPopup(interactiveResponse.url);

        // Poll transaction until complete
        const currentStatus = await pollWithdrawUntilComplete({
          secretKey: SOURCE_KEYPAIR_SECRET,
          popup,
          transactionId: interactiveResponse.id,
          token,
          sep24TransferServerUrl,
          networkPassphrase: networkConfig.network,
          networkUrl: networkConfig.url,
          assetCode,
          assetIssuer,
          sep9Fields,
          contractId,
        });

        return {
          currentStatus,
        };
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      const resultCodes = error?.response?.data?.extras?.result_codes;

      log.error({
        title: "SEP-24 withdrawal failed",
        body: `${errorMessage} ${
          resultCodes ? JSON.stringify(resultCodes) : ""
        }`,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: Sep24WithdrawAssetInitialState = {
  data: {
    currentStatus: "",
  },
  status: undefined,
  errorString: undefined,
};

const sep24WithdrawAssetSlice = createSlice({
  name: "sep24WithdrawAsset",
  initialState,
  reducers: {
    resetSep24WithdrawAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(withdrawAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(withdrawAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(withdrawAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = sep24WithdrawAssetSlice;
export const { resetSep24WithdrawAssetAction } =
  sep24WithdrawAssetSlice.actions;
