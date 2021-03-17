import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { assetOverridesSelector } from "ducks/assetOverrides";
import { untrustedAssetsSelector } from "ducks/untrustedAssets";
import { getErrorMessage } from "helpers/getErrorMessage";
import { log } from "helpers/log";
import {
  ActionStatus,
  RejectMessage,
  Asset,
  AllAssetsInitialState,
  AssetCategory,
} from "types/types.d";

type IncludeAssetOverridesProps = {
  assets: Asset[];
  assetCategory: AssetCategory;
  assetOverrides: Asset[];
};

const includeAssetOverrides = ({
  assets,
  assetCategory,
  assetOverrides,
}: IncludeAssetOverridesProps) =>
  assets.reduce((result: Asset[], asset) => {
    const overrideAsset = assetOverrides.find(
      (ao) => ao.assetString === asset.assetString,
    );
    const updatedAsset = overrideAsset
      ? { ...overrideAsset, category: AssetCategory.OVERRIDE }
      : { ...asset, category: assetCategory };

    return [...result, updatedAsset];
  }, []);

export const getAllAssetsAction = createAsyncThunk<
  Asset[],
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>("allAssets/getAllAssetsAction", (_, { rejectWithValue, getState }) => {
  const { assets } = accountSelector(getState());
  const { data: untrustedAssets } = untrustedAssetsSelector(getState());
  const { data: assetOverrides } = assetOverridesSelector(getState());

  const trusted = includeAssetOverrides({
    assets,
    assetCategory: AssetCategory.TRUSTED,
    assetOverrides,
  });

  const untrusted = includeAssetOverrides({
    assets: untrustedAssets,
    assetCategory: AssetCategory.UNTRUSTED,
    assetOverrides,
  });

  try {
    return [...trusted, ...untrusted];
  } catch (error) {
    log.error({ title: getErrorMessage(error) });
    return rejectWithValue({
      errorString: getErrorMessage(error),
    });
  }
});

const initialState: AllAssetsInitialState = {
  data: [],
  errorString: undefined,
  status: undefined,
};

const allAssetsSlice = createSlice({
  name: "allAssets",
  initialState,
  reducers: {
    resetAllAssetsStatusAction: (state) => {
      state.status = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getAllAssetsAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(getAllAssetsAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(getAllAssetsAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const allAssetsSelector = (state: RootState) => state.allAssets;

export const { reducer } = allAssetsSlice;
export const { resetAllAssetsStatusAction } = allAssetsSlice.actions;
