import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getCatchError } from "@stellar/frontend-helpers";
import { RootState } from "config/store";
import {
  getErrorMessage,
} from "demo-wallet-shared/build/helpers/getErrorMessage";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  ActionStatus,
  Asset,
  ContractAssetsInitialState,
  RejectMessage,
} from "types/types";
import {
  fetchContractAsset,
  fetchContractAssets,
} from "../helpers/fetchContractAccountDetails";

export const fetchContractAssetsAction = createAsyncThunk<
  Asset[],
  { assetsString: string; contractId: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAssets/fetchContractAssetsAction",
  async ({ assetsString, contractId }, { rejectWithValue }) => {
    const assetStrings = assetsString.split(",").filter(Boolean);
    try {
      const userAssets: Array<{ code: string; issuer: string; homeDomain?: string }> =
        assetStrings.map(assetString => {
          const [code, issuer] = assetString.split(":");
          return {
            code,
            issuer,
            homeDomain: undefined,
          };
        });
      return await fetchContractAssets(contractId, userAssets);
    } catch (error) {
      return rejectWithValue({
        errorString: getErrorMessage(error),
      });
    }
  },
)

export const addContractAssetAction = createAsyncThunk<
  Asset,
  { assetsString: string; contractId: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAssets/addContractAssetAction",
  async ({ assetsString, contractId }, { rejectWithValue }) => {
    const assetStrings = assetsString.split(",").filter(Boolean);
    const lastAssetString = assetStrings[assetStrings.length - 1];
    try {
      // Convert single asset string to userAssets format
      const [code, issuer] = lastAssetString.split(":");
      const userAsset = {
        code,
        issuer,
        homeDomain: undefined,
      };
      return await fetchContractAsset(contractId, userAsset); // Return the single asset
    } catch (e) {
      const error = getCatchError(e);
      log.error({ title: error.toString() });
      return rejectWithValue({
        errorString: getErrorMessage(error),
      });
    }
  },
);

export const removeContractAssetAction = createAsyncThunk<
  Asset[],
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAssets/removeContractAssetAction",
  (removeAssetString: string, { getState }) => {
    const { data } = contractAssetsSelector(getState());
    return data.filter((ca: Asset) => ca.assetString !== removeAssetString);
  },
);

const initialState: ContractAssetsInitialState = {
  data: [],
  errorString: undefined,
  status: undefined,
};

const contractAssetsSlice = createSlice({
  name: "contractAssets",
  initialState,
  reducers: {
    resetContractAssetStatusAction: (state) => {
      state.status = undefined;
    },
    resetContractAssetsAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchContractAssetsAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchContractAssetsAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchContractAssetsAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
    builder.addCase(addContractAssetAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(addContractAssetAction.fulfilled, (state, action) => {
      // Add single asset to existing data
      state.data.push(action.payload);
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(addContractAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      removeContractAssetAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(removeContractAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
  },
});

export const contractAssetsSelector = (state: RootState) =>
  state.contractAssets;

export const { resetContractAssetStatusAction, resetContractAssetsAction } =
  contractAssetsSlice.actions;

export const { reducer } = contractAssetsSlice;
