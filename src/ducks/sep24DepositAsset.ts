import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  sep10AuthStart,
  sep10AuthSign,
  sep10AuthSend,
} from "methods/sep10Auth";
import {
  checkInfo,
  interactiveDepositFlow,
  createPopup,
  pollDepositUntilComplete,
} from "methods/sep24";
import { checkTomlForFields } from "methods/checkTomlForFields";
import { trustAsset } from "methods/trustAsset";
import {
  Asset,
  ActionStatus,
  Sep24DepositAssetInitialState,
  RejectMessage,
  TomlFields,
  CheckInfoType,
} from "types/types.d";

export const depositAssetAction = createAsyncThunk<
  { currentStatus: string; trustedAssetAdded?: string },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24DepositAsset/depositAssetAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;

    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);
    const publicKey = data?.id;

    // This is unlikely
    if (!publicKey) {
      throw new Error("Something is wrong with Account, no public key.");
    }

    // This is unlikely
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    log.instruction({ title: "Initiate a SEP-24 deposit" });

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

    try {
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
        type: CheckInfoType.DEPOSIT,
        toml: tomlResponse,
        assetCode,
      });

      log.instruction({
        title:
          "Deposit is enabled, and requires authentication so we should go through SEP-0010",
      });

      // SEP-10 start
      const challengeTransaction = await sep10AuthStart({
        authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
        serverSigningKey: tomlResponse.SIGNING_KEY,
        publicKey,
        homeDomain,
      });

      // SEP-10 sign
      const signedChallengeTransaction = sep10AuthSign({
        secretKey,
        networkPassphrase: networkConfig.network,
        challengeTransaction,
      });

      // SEP-10 send
      const token = await sep10AuthSend({
        authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
        signedChallengeTransaction,
      });

      // Interactive flow
      const interactiveResponse = await interactiveDepositFlow({
        assetCode,
        publicKey,
        sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
        token,
      });

      // Create popup
      const popup = createPopup(interactiveResponse.url);

      // Poll transaction until complete
      const {
        currentStatus,
        trustedAssetAdded,
      } = await pollDepositUntilComplete({
        popup,
        transactionId: interactiveResponse.id,
        token,
        sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
        trustAssetCallback,
      });

      return {
        currentStatus,
        trustedAssetAdded,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "Deposit failed",
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
