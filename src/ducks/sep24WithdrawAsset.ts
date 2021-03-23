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
  interactiveWithdrawFlow,
  createPopup,
  pollWithdrawUntilComplete,
} from "methods/sep24";
import { checkTomlForFields } from "methods/checkTomlForFields";
import {
  Asset,
  ActionStatus,
  RejectMessage,
  Sep24WithdrawAssetInitialState,
  TomlFields,
  CheckInfoType,
} from "types/types.d";

export const withdrawAssetAction = createAsyncThunk<
  { currentStatus: string },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24WithdrawAsset/withdrawAssetAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetIssuer, assetCode, homeDomain } = asset;
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

    try {
      // Check toml
      const tomlResponse = await checkTomlForFields({
        sepName: "SEP-24 withdrawal",
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
        type: CheckInfoType.WITHDRAWAL,
        toml: tomlResponse,
        assetCode,
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
      const interactiveResponse = await interactiveWithdrawFlow({
        assetCode,
        publicKey,
        sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
        token,
      });

      // Create popup
      const popup = createPopup(interactiveResponse.url);

      // Poll transaction until complete
      const currentStatus = await pollWithdrawUntilComplete({
        secretKey,
        popup,
        transactionId: interactiveResponse.id,
        token,
        sep24TransferServerUrl: tomlResponse.TRANSFER_SERVER_SEP0024,
        networkPassphrase: networkConfig.network,
        networkUrl: networkConfig.url,
        assetCode,
        assetIssuer,
      });

      return {
        currentStatus,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "Withdrawal failed",
        body: errorMessage,
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
export const {
  resetSep24WithdrawAssetAction,
} = sep24WithdrawAssetSlice.actions;
