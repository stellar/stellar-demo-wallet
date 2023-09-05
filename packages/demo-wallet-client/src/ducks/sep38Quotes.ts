import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { log } from "demo-wallet-shared/build/helpers/log";

import {
  getInfo,
  getPrices,
  postQuote,
} from "demo-wallet-shared/build/methods/sep38Quotes";

import {
  ActionStatus,
  AnchorBuyAsset,
  AnchorQuote,
  AnchorQuoteAsset,
  AnchorQuoteRequest,
  RejectMessage,
  Sep38QuotesInitialState,
} from "types/types";

export const fetchSep38QuotesInfoAction = createAsyncThunk<
  {
    assets: AnchorQuoteAsset[];
    sellAsset: string;
    sellAmount: string;
    serverUrl: string | undefined;
  },
  {
    anchorQuoteServerUrl: string | undefined;
    sellAsset: string;
    sellAmount: string;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep38Quotes/fetchSep38QuotesInfoAction",
  async (
    { anchorQuoteServerUrl, sellAsset, sellAmount },
    { rejectWithValue },
  ) => {
    try {
      const result = await getInfo(anchorQuoteServerUrl, {
        sell_asset: sellAsset,
        sell_amount: sellAmount,
      });

      return {
        assets: result.assets,
        sellAsset,
        sellAmount,
        serverUrl: anchorQuoteServerUrl,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

export const fetchSep38QuotesPricesAction = createAsyncThunk<
  AnchorBuyAsset[],
  {
    token: string;
    anchorQuoteServerUrl: string;
    options: {
      sellAsset: string;
      sellAmount: string;
      sellDeliveryMethod?: string;
      buyDeliveryMethod?: string;
      countryCode?: string;
    };
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep38Quotes/fetchSep38QuotesPricesAction",
  async ({ token, anchorQuoteServerUrl, options }, { rejectWithValue }) => {
    const {
      sellAsset,
      sellAmount,
      sellDeliveryMethod,
      buyDeliveryMethod,
      countryCode,
    } = options;

    try {
      const result = await getPrices({
        token,
        anchorQuoteServerUrl,
        options: {
          sell_asset: sellAsset,
          sell_amount: sellAmount,
          sell_delivery_method: sellDeliveryMethod,
          buy_delivery_method: buyDeliveryMethod,
          country_code: countryCode,
        },
      });

      return result.buy_assets;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

export const postSep38QuoteAction = createAsyncThunk<
  AnchorQuote,
  AnchorQuoteRequest,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep38Quotes/postSep38QuoteAction",
  async (
    {
      anchorQuoteServerUrl,
      token,
      sell_asset,
      buy_asset,
      sell_amount,
      buy_amount,
      expire_after,
      sell_delivery_method,
      buy_delivery_method,
      country_code,
      context,
    },
    { rejectWithValue },
  ) => {
    try {
      const result = await postQuote({
        token,
        anchorQuoteServerUrl,
        sell_asset,
        buy_asset,
        sell_amount,
        buy_amount,
        expire_after,
        sell_delivery_method,
        buy_delivery_method,
        country_code,
        context,
      });

      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: errorMessage,
      });
      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: Sep38QuotesInitialState = {
  data: {
    serverUrl: undefined,
    sellAsset: undefined,
    sellAmount: undefined,
    assets: [],
    prices: [],
    quote: undefined,
  },
  errorString: undefined,
  status: undefined,
};

const sep38QuotesSlice = createSlice({
  name: "sep38Quotes",
  initialState,
  reducers: {
    resetSep38QuotesAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(
      fetchSep38QuotesInfoAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
        state.data = { ...state.data, prices: [], quote: undefined };
      },
    );
    builder.addCase(fetchSep38QuotesInfoAction.fulfilled, (state, action) => {
      state.data = {
        ...state.data,
        assets: action.payload.assets,
        sellAsset: action.payload.sellAsset,
        sellAmount: action.payload.sellAmount,
        serverUrl: action.payload.serverUrl,
      };
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchSep38QuotesInfoAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(
      fetchSep38QuotesPricesAction.pending,
      (state = initialState) => {
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(fetchSep38QuotesPricesAction.fulfilled, (state, action) => {
      state.data = {
        ...state.data,
        prices: action.payload,
      };
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchSep38QuotesPricesAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(postSep38QuoteAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(postSep38QuoteAction.fulfilled, (state, action) => {
      state.data = {
        ...state.data,
        quote: action.payload,
      };
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(postSep38QuoteAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sep38QuotesSelector = (state: RootState) => state.sep38Quotes;

export const { reducer } = sep38QuotesSlice;
export const { resetSep38QuotesAction } = sep38QuotesSlice.actions;
