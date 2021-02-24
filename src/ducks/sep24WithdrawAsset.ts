import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
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
  interactiveWithdrawFlow,
  createPopup,
  pollWithdrawUntilComplete,
} from "methods/sep24";
import {
  ActionStatus,
  RejectMessage,
  Sep24WithdrawAssetInitialState,
} from "types/types.d";

export const withdrawAssetAction = createAsyncThunk<
  { currentStatus: string },
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep24WithdrawAsset/withdrawAssetAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);
    const publicKey = data?.id;

    if (!publicKey) {
      throw new Error("Something is wrong with Account, no public key.");
    }

    try {
      // Check toml
      const tomlResponse = await checkToml({
        assetIssuer,
        networkUrl: networkConfig.url,
      });

      // Check info
      await checkInfo({ toml: tomlResponse, assetCode });

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
      log.error({
        title: "Withdrawal failed",
        body: error.toString(),
      });

      return rejectWithValue({
        errorString: error.toString(),
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
