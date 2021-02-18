import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import StellarSdk from "stellar-sdk";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getAssetRecord } from "helpers/getAssetRecord";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
  RejectMessage,
  UntrustedAsset,
  UntrustedAssetsInitialState,
} from "types/types.d";

const removeExistingAssets = ({
  assetsString,
  untrustedAssets,
}: {
  assetsString: string;
  untrustedAssets: UntrustedAsset[];
}) => {
  const assetsArray = assetsString.split(",");

  if (!untrustedAssets.length) {
    return assetsArray;
  }

  const untrustedAssetsList = untrustedAssets.map((ua) => ua.assetString);

  return assetsArray.filter(
    (asset: string) => !untrustedAssetsList.includes(asset),
  );
};

export const addUntrustedAssetAction = createAsyncThunk<
  UntrustedAsset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "untrustedAssets/addUntrustedAssetAction",
  async (assetsString, { rejectWithValue, getState }) => {
    log.instruction({ title: "Start adding untrusted asset" });

    const { pubnet } = settingsSelector(getState());
    const { data } = untrustedAssetsSelector(getState());

    const assetsListToAdd = removeExistingAssets({
      assetsString,
      untrustedAssets: data,
    });

    if (!assetsListToAdd.length) {
      log.error({ title: "No new assets to add" });
      rejectWithValue({
        errorString: `No new assets to add.`,
      });
    }

    const server = new StellarSdk.Server(getNetworkConfig(pubnet).url);
    const response = await getAssetRecord(assetsListToAdd, server);

    if (!response.length) {
      log.error({ title: "No new assets to add" });
      rejectWithValue({
        errorString: `No new assets were added.`,
      });
    }

    return response;
  },
);

const initialState: UntrustedAssetsInitialState = {
  data: [],
  errorString: undefined,
  status: undefined,
};

const untrustedAssetsSlice = createSlice({
  name: "untrustedAssets",
  initialState,
  reducers: {
    removeUntrustedAssetAction: (state, action: PayloadAction<string>) => {
      state.data = state.data.filter((ua) => ua.assetString !== action.payload);
    },
    resetUntrustedAssetsAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(addUntrustedAssetAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(addUntrustedAssetAction.fulfilled, (state, action) => {
      state.data = [...state.data, ...action.payload];
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(addUntrustedAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const untrustedAssetsSelector = (state: RootState) =>
  state.untrustedAssets;

export const { reducer } = untrustedAssetsSlice;
export const {
  removeUntrustedAssetAction,
  resetUntrustedAssetsAction,
} = untrustedAssetsSlice.actions;
