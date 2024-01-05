import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getAssetOverridesData } from "demo-wallet-shared/build/helpers/getAssetOverridesData";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchKeyPairStringToArray } from "demo-wallet-shared/build/helpers/searchKeyPairStringToArray";
import {
  ActionStatus,
  Asset,
  AssetOverridesInitialState,
  RejectMessage,
} from "types/types";

export const addAssetOverridesAction = createAsyncThunk<
  Asset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "assetOverrides/addAssetOverridesAction",
  async (assetOverridesString, { rejectWithValue, getState }) => {
    const { untrustedAssets: untrustedAssetsSetting } = settingsSelector(
      getState(),
    );

    try {
      const assetOverrides = searchKeyPairStringToArray(assetOverridesString);
      const untrustedAssets = searchKeyPairStringToArray(
        untrustedAssetsSetting,
      ).map((u) => u.assetString);

      const response = await getAssetOverridesData({
        assetOverrides,
        networkUrl: getNetworkConfig().url,
        untrustedAssets,
      });

      return response;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      log.error({ title: errorMessage });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: AssetOverridesInitialState = {
  data: [],
  errorString: undefined,
  status: undefined,
};

const assetOverridesSlice = createSlice({
  name: "assetOverrides",
  initialState,
  reducers: {
    resetAssetOverridesStatusAction: (state) => {
      state.status = undefined;
    },
    resetAssetOverridesAction: () => initialState,
    updateAssetOverrideAction: (state, action) => {
      if (state.data.length) {
        const updated = state.data.map((a) => {
          if (a.assetString === action.payload.assetString) {
            return { ...a, ...action.payload.updatedProperties };
          }

          return a;
        });

        state.data = updated;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(addAssetOverridesAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(addAssetOverridesAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(addAssetOverridesAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const assetOverridesSelector = (state: RootState) =>
  state.assetOverrides;

export const { reducer } = assetOverridesSlice;
export const {
  resetAssetOverridesStatusAction,
  resetAssetOverridesAction,
  updateAssetOverrideAction,
} = assetOverridesSlice.actions;
