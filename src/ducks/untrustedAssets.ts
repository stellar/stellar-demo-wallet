import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getUntrustedAssetData } from "helpers/getUntrustedAssetData";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
  RejectMessage,
  Asset,
  UntrustedAssetsInitialState,
} from "types/types.d";

const removeExistingAssets = ({
  assetsString,
  untrustedAssets,
}: {
  assetsString: string;
  untrustedAssets: Asset[];
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
  Asset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "untrustedAssets/addUntrustedAssetAction",
  async (assetsString, { rejectWithValue, getState }) => {
    log.instruction({ title: "Start adding untrusted asset" });

    const { data: accountData } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const { data } = untrustedAssetsSelector(getState());

    try {
      const assetsListToAdd = removeExistingAssets({
        assetsString,
        untrustedAssets: data,
      });

      if (!assetsListToAdd.length) {
        log.error({ title: "No new assets to ad" });
        return [];
      }

      const response = await getUntrustedAssetData({
        assetsToAdd: assetsListToAdd,
        accountAssets: accountData?.balances,
        networkUrl: getNetworkConfig(pubnet).url,
      });

      if (!response.length) {
        log.instruction({ title: "No new assets to add" });
        return [];
      }

      return response;
    } catch (error) {
      return rejectWithValue({
        errorString: error.message,
      });
    }
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
