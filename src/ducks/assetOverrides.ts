import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getAssetOverridesData } from "helpers/getAssetOverridesData";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { searchKeyPairStringToArray } from "helpers/searchKeyPairStringToArray";
import {
  ActionStatus,
  Asset,
  AssetOverridesInitialState,
  RejectMessage,
} from "types/types.d";

export const addAssetOverridesAction = createAsyncThunk<
  Asset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "assetOverrides/addAssetOverridesAction",
  async (assetOverridesString, { rejectWithValue, getState }) => {
    const { pubnet } = settingsSelector(getState());

    try {
      const assetOverrides = searchKeyPairStringToArray(assetOverridesString);

      const response = await getAssetOverridesData({
        assetOverrides,
        networkUrl: getNetworkConfig(pubnet).url,
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
} = assetOverridesSlice.actions;
