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
  checkToml,
  checkInfo,
  interactiveDepositFlow,
  createPopup,
  pollDepositUntilComplete,
} from "methods/sep24";
import { trustAsset } from "methods/trustAsset";
import {
  ActionStatus,
  Sep24DepositAssetInitialState,
  RejectMessage,
} from "types/types.d";

export const depositAssetAction = createAsyncThunk<
  { currentStatus: string; trustedAssetAdded?: string },
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24DepositAsset/depositAssetAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);
    const publicKey = data?.id;

    if (!publicKey) {
      throw new Error("Something is wrong with Account, no public key.");
    }

    log.instruction({ title: "Initiate a SEP-24 deposit" });

    // TODO: get homeDomain
    const homeDomain = undefined;

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
      const tomlResponse = await checkToml({
        assetIssuer,
        networkUrl: networkConfig.url,
        homeDomain,
      });

      // Check info
      await checkInfo({ toml: tomlResponse, assetCode });

      log.instruction({
        title:
          "Deposit is enabled, and requires authentication so we should go through SEP-0010",
      });

      // SEP-10 start
      const challengeTransaction = await sep10AuthStart({
        authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
        secretKey,
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
      log.error({
        title: "Deposit failed",
        body: getErrorMessage(error),
      });

      return rejectWithValue({
        errorString: getErrorMessage(error),
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
