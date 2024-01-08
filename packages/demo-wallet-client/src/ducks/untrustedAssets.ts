import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCatchError } from "@stellar/frontend-helpers";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getUntrustedAssetData } from "demo-wallet-shared/build/helpers/getUntrustedAssetData";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchKeyPairStringToArray } from "demo-wallet-shared/build/helpers/searchKeyPairStringToArray";
import {
  ActionStatus,
  RejectMessage,
  Asset,
  UntrustedAssetsInitialState,
} from "types/types";

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
    const { data: accountData } = accountSelector(getState());
    const { data } = untrustedAssetsSelector(getState());
    const { assetOverrides } = settingsSelector(getState());

    try {
      const overrideIds = searchKeyPairStringToArray(assetOverrides).map(
        (a) => a.assetString,
      );

      const assetsListToAdd = removeExistingAssets({
        assetsString,
        untrustedAssets: data,
      }).filter((a) => !overrideIds.includes(a));

      if (!assetsListToAdd.length) {
        return [];
      }

      log.instruction({ title: "Adding untrusted asset" });

      let response;

      try {
        response = await getUntrustedAssetData({
          assetsToAdd: assetsListToAdd,
          accountAssets: accountData?.balances,
          networkUrl: getNetworkConfig().url,
        });
      } catch (e) {
        const error = getCatchError(e);
        throw new Error(error.message);
      }

      if (!response.length) {
        log.instruction({ title: "No new assets to add" });
        return [];
      }

      return response;
    } catch (e) {
      const error = getCatchError(e);
      log.error({ title: error.toString() });
      return rejectWithValue({
        errorString: getErrorMessage(error),
      });
    }
  },
);

export const removeUntrustedAssetAction = createAsyncThunk<
  Asset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "untrustedAssets/removeUntrustedAssetAction",
  (removeAssetString, { getState }) => {
    const { data } = untrustedAssetsSelector(getState());
    return data.filter((ua) => ua.assetString !== removeAssetString);
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
    resetUntrustedAssetStatusAction: (state) => {
      state.status = undefined;
    },
    resetUntrustedAssetsAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(addUntrustedAssetAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(addUntrustedAssetAction.fulfilled, (state, action) => {
      const newAssets = action.payload.filter(
        (n) => !state.data.find((a) => a.assetString === n.assetString),
      );

      state.data = [...state.data, ...newAssets];
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(addUntrustedAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      removeUntrustedAssetAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(removeUntrustedAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
  },
});

export const untrustedAssetsSelector = (state: RootState) =>
  state.untrustedAssets;

export const { reducer } = untrustedAssetsSlice;
export const { resetUntrustedAssetStatusAction, resetUntrustedAssetsAction } =
  untrustedAssetsSlice.actions;
