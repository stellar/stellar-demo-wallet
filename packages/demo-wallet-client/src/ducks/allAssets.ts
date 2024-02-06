import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Types } from "@stellar/wallet-sdk";

import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { assetOverridesSelector } from "ducks/assetOverrides";
import { untrustedAssetsSelector } from "ducks/untrustedAssets";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { log } from "demo-wallet-shared/build/helpers/log";
import { getAssetData } from "demo-wallet-shared/build/helpers/getAssetData";
import { searchKeyPairStringToArray } from "demo-wallet-shared/build/helpers/searchKeyPairStringToArray";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { XLM_NATIVE_ASSET } from "demo-wallet-shared/build/types/types";
import {
  ActionStatus,
  RejectMessage,
  Asset,
  AllAssetsInitialState,
  AssetCategory,
} from "types/types";

type IncludeAssetOverridesProps = {
  assets: Asset[];
  balances?: Types.BalanceMap;
  assetCategory: AssetCategory;
  assetOverrides: Asset[];
};

const excludeXlm = (assets: Asset[]) =>
  assets.filter((a) => a.assetString !== XLM_NATIVE_ASSET);

const includeAssetOverrides = ({
  assets,
  balances,
  assetCategory,
  assetOverrides,
}: IncludeAssetOverridesProps) => {
  const isUntrusted = assetCategory === AssetCategory.UNTRUSTED;
  const overrides = assetOverrides.filter((o) => o.isUntrusted === isUntrusted);

  let xlmBalance = assets.find((a) => a.assetString === XLM_NATIVE_ASSET);
  const xlmOverride = overrides.find((a) => a.assetString === XLM_NATIVE_ASSET);

  // If there is XLM override, merge XLM balance and asset override asset data.
  // Note: XLM override can be added only to an active account, so there must be
  // XLM balance.
  if (xlmBalance && xlmOverride) {
    const { assetIssuer, homeDomain, isOverride, supportedActions } =
      xlmOverride;
    xlmBalance = {
      ...xlmBalance,
      assetIssuer,
      homeDomain,
      isOverride,
      supportedActions,
    };
  }

  // Becase xlmBalance is handled separately, we need to exclude it from both
  // arrays.
  return [
    ...(xlmBalance ? [xlmBalance] : []),
    ...excludeXlm(assets),
    ...excludeXlm(overrides),
  ].map((a) => ({
    ...a,
    category: assetCategory,
    // Use balance from account balances
    total: balances?.[a.assetString]?.available?.toString() || a.total || "0",
  }));
};

// All assets (from account balances, assetOverrides, and untrustedAssets) are
// aggregated here to display on the UI.

// Assets with overrides will be removed from untrustedAssets and will be skipped
// in account balances to avoid making API calls with on-chain home domain. All
// assets with overrides will be added to assetOverrides in store and picked from
// there in this action.
export const getAllAssetsAction = createAsyncThunk<
  Asset[],
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>("allAssets/getAllAssetsAction", async (_, { rejectWithValue, getState }) => {
  const networkConfig = getNetworkConfig();

  const { data } = accountSelector(getState());
  const { data: untrustedAssets } = untrustedAssetsSelector(getState());
  const { data: assetOverrides } = assetOverridesSelector(getState());
  const { assetOverrides: asssetOverrideSetting } = settingsSelector(
    getState(),
  );

  const overrideIds = searchKeyPairStringToArray(asssetOverrideSetting).map(
    (a) => a.assetString,
  );

  const assets = await getAssetData({
    balances: data?.balances,
    networkUrl: networkConfig.url,
    overrideIds,
  });

  const trusted = includeAssetOverrides({
    assets,
    balances: data?.balances,
    assetCategory: AssetCategory.TRUSTED,
    assetOverrides,
  });

  const untrusted = includeAssetOverrides({
    assets: untrustedAssets,
    assetCategory: AssetCategory.UNTRUSTED,
    assetOverrides,
  });

  try {
    // Sort to make sure the order doesn't change when adding/removing overrides
    return [...trusted, ...untrusted].sort((a, b) => {
      const assetA = a.assetString;
      const assetB = b.assetString;

      if (assetA < assetB) {
        return -1;
      }

      if (assetA > assetB) {
        return 1;
      }

      return 0;
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    log.error({ title: errorMessage });
    return rejectWithValue({
      errorString: errorMessage,
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
