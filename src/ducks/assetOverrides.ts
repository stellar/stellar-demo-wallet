import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { AssetOverridesInitialState } from "types/types.d";

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
});

export const assetOverridesSelector = (state: RootState) =>
  state.assetOverrides;

export const { reducer } = assetOverridesSlice;
export const {
  resetAssetOverridesStatusAction,
  resetAssetOverridesAction,
} = assetOverridesSlice.actions;
