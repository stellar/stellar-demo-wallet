import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import StellarSdk from "stellar-sdk";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import {
  ActionStatus,
  RejectMessage,
  UntrustedAsset,
  UntrustedAssetsInitialState,
} from "types/types.d";

const getAssetData = async (assets: string[], server: any) => {
  let response: UntrustedAsset[] = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < assets.length; i++) {
    const assetString = assets[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records) {
      console.log(`Asset ${assetString} does not exist.`);
    } else {
      response = [
        ...response,
        {
          assetString,
          assetCode,
          assetIssuer,
          balance: "0.0000000",
          assetType: assetResponse.records[0].asset_type,
          untrusted: true,
        },
      ];
    }
  }

  return response;
};

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

  // TODO: Log if already added
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
    const { pubnet } = settingsSelector(getState());
    const { data } = untrustedAssetsSelector(getState());

    const assetsListToAdd = removeExistingAssets({
      assetsString,
      untrustedAssets: data,
    });

    if (!assetsListToAdd.length) {
      rejectWithValue({
        errorString: `No new assets to add.`,
      });
    }

    const server = new StellarSdk.Server(getNetworkConfig(pubnet).url);
    const response = await getAssetData(assetsListToAdd, server);

    if (!response.length) {
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
