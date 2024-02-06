import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { SettingsInitialState, Setting } from "types/types";

const initialState: SettingsInitialState = {
  assetOverrides: "",
  secretKey: "",
  untrustedAssets: "",
  claimableBalanceSupported: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    updateSettingsAction: (state, action: PayloadAction<Setting>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const settingsSelector = (state: RootState) => state.settings;

export const { reducer } = settingsSlice;
export const { updateSettingsAction } = settingsSlice.actions;
