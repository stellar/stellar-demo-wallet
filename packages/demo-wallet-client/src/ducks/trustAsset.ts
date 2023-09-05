import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorString } from "demo-wallet-shared/build/helpers/getErrorString";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { trustAsset } from "demo-wallet-shared/build/methods/trustAsset";
import {
  ActionStatus,
  RejectMessage,
  TrustAssetInitialState,
  TrustAssetParam,
} from "types/types";

interface TrustAssetActionResponse {
  assetString: string;
  response: string;
}

export const trustAssetAction = createAsyncThunk<
  TrustAssetActionResponse,
  TrustAssetParam,
  { rejectValue: RejectMessage; state: RootState }
>(
  "trustAsset/trustAssetAction",
  async (untrustedAsset, { rejectWithValue, getState }) => {
    const { secretKey } = settingsSelector(getState());
    const networkConfig = getNetworkConfig();

    try {
      return {
        assetString: untrustedAsset.assetString,
        response: JSON.stringify(
          await trustAsset({
            secretKey,
            untrustedAsset,
            networkUrl: networkConfig.url,
            networkPassphrase: networkConfig.network,
          }),
        ),
      };
    } catch (error) {
      return rejectWithValue({
        errorString: getErrorString(error),
      });
    }
  },
);

const initialState: TrustAssetInitialState = {
  assetString: "",
  data: null,
  status: undefined,
  errorString: undefined,
};

const trustAssetSlice = createSlice({
  name: "trustAsset",
  initialState,
  reducers: {
    resetTrustAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(trustAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(trustAssetAction.fulfilled, (state, action) => {
      state.assetString = action.payload.assetString;
      state.data = action.payload.response;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(trustAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = trustAssetSlice;
export const { resetTrustAssetAction } = trustAssetSlice.actions;
