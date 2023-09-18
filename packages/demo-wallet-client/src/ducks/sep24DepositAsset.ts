import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { custodialSelector } from "ducks/custodial";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { normalizeHomeDomainUrl } from "demo-wallet-shared/build/helpers/normalizeHomeDomainUrl";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  sep10AuthStart,
  sep10AuthSign,
  sep10AuthSend,
} from "demo-wallet-shared/build/methods/sep10Auth";
import {
  checkInfo,
  interactiveDepositFlow,
  createPopup,
  pollDepositUntilComplete,
} from "demo-wallet-shared/build/methods/sep24";
import { checkTomlForFields } from "demo-wallet-shared/build/methods/checkTomlForFields";
import { trustAsset } from "demo-wallet-shared/build/methods/trustAsset";
import {
  Asset,
  ActionStatus,
  Sep24DepositAssetInitialState,
  RejectMessage,
  TomlFields,
  AnchorActionType,
} from "types/types";

export const depositAssetAction = createAsyncThunk<
  { currentStatus: string; trustedAssetAdded?: string },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24DepositAsset/depositAssetAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;

    const { data, secretKey } = accountSelector(getState());
    const { claimableBalanceSupported } = settingsSelector(getState());
    const {
      isEnabled: custodialIsEnabled,
      secretKey: custodialSecretKey,
      publicKey: custodialPublicKey,
      memoId: custodialMemoId,
    } = custodialSelector(getState());

    try {
      const networkConfig = getNetworkConfig();
      const publicKey = data?.id;

      // This is unlikely
      if (!publicKey) {
        throw new Error("Something is wrong with Account, no public key.");
      }

      // This is unlikely (except for XLM)
      if (!homeDomain) {
        throw new Error("Something went wrong, home domain is not defined.");
      }

      // This is unlikely
      if (
        custodialIsEnabled &&
        !(custodialSecretKey && custodialPublicKey && custodialMemoId)
      ) {
        throw new Error(
          "Custodial mode requires secret key, public key, and memo ID",
        );
      }

      log.instruction({ title: "Initiating a SEP-24 deposit" });

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

      // Check toml
      const tomlResponse = await checkTomlForFields({
        sepName: "SEP-24 deposit",
        assetIssuer,
        requiredKeys: [
          TomlFields.SIGNING_KEY,
          TomlFields.TRANSFER_SERVER_SEP0024,
          TomlFields.WEB_AUTH_ENDPOINT,
        ],
        networkUrl: networkConfig.url,
        homeDomain,
      });

      // Check info
      await checkInfo({
        type: AnchorActionType.DEPOSIT,
        toml: tomlResponse,
        assetCode,
      });

      log.instruction({
        title:
          "SEP-24 deposit is enabled, and requires authentication so we should go through SEP-10",
      });

      // SEP-10 start
      const challengeTransaction = await sep10AuthStart({
        authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
        serverSigningKey: tomlResponse.SIGNING_KEY,
        publicKey: custodialPublicKey || publicKey,
        homeDomain: normalizeHomeDomainUrl(homeDomain).host,
        clientDomain,
        memoId: custodialMemoId,
      });

      // SEP-10 sign
      const signedChallengeTransaction = await sep10AuthSign({
        secretKey: custodialSecretKey || secretKey,
        networkPassphrase: networkConfig.network,
        challengeTransaction,
        walletBackendEndpoint,
      });

      // SEP-10 send
      const token = await sep10AuthSend({
        authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
        signedChallengeTransaction,
      });

      const generatedMemoId = custodialIsEnabled
        ? Math.floor(Math.random() * 100).toString()
        : undefined;

      // Interactive flow
      const interactiveResponse = await interactiveDepositFlow({
        assetCode,
        publicKey,
        sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
        token,
        claimableBalanceSupported,
        memo: generatedMemoId,
        memoType: custodialIsEnabled ? "id" : undefined,
      });

      // Create popup
      const popup = createPopup(interactiveResponse.url);

      // Poll transaction until complete
      const { currentStatus, trustedAssetAdded } =
        await pollDepositUntilComplete({
          popup,
          transactionId: interactiveResponse.id,
          token,
          sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
          trustAssetCallback,
          custodialMemoId: generatedMemoId,
        });

      return {
        currentStatus,
        trustedAssetAdded,
      };
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
