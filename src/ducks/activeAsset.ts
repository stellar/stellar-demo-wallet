import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { ActiveAssetInitialState } from "types/types.d";

const initialState: ActiveAssetInitialState = {
  asset: undefined,
  status: undefined,
};

const activeAssetSlice = createSlice({
  name: "activeAsset",
  initialState,
  reducers: {
    setActiveAsset: (state, action) => {
      state.asset = action.payload;
    },
    setActiveAssetStatus: (state, action) => {
      state.status = action.payload;
    },
    resetActiveAsset: () => initialState,
  },
});

export const activeAssetSelector = (state: RootState) => state.activeAsset;

export const { reducer } = activeAssetSlice;
export const {
  setActiveAsset,
  setActiveAssetStatus,
  resetActiveAsset,
} = activeAssetSlice.actions;
