import {
  configureStore,
  isPlain,
  createAction,
  CombinedState,
} from "@reduxjs/toolkit";
import { combineReducers, Action } from "redux";
import BigNumber from "bignumber.js";

import { reducer as account } from "ducks/account";
import { reducer as activeAsset } from "ducks/activeAsset";
import { reducer as allAssets } from "ducks/allAssets";
import { reducer as assetOverrides } from "ducks/assetOverrides";
import { reducer as claimAsset } from "ducks/claimAsset";
import { reducer as claimableBalances } from "ducks/claimableBalances";
import { reducer as sep6DepositAsset } from "ducks/sep6DepositAsset";
import { reducer as sep6WithdrawAsset } from "ducks/sep6WithdrawAsset";
import { reducer as sep8Send } from "ducks/sep8Send";
import { reducer as sep24DepositAsset } from "ducks/sep24DepositAsset";
import { reducer as sep24WithdrawAsset } from "ducks/sep24WithdrawAsset";
import { reducer as sep31Send } from "ducks/sep31Send";
import { reducer as sep38Quotes } from "ducks/sep38Quotes";
import { reducer as logs } from "ducks/logs";
import { reducer as sendPayment } from "ducks/sendPayment";
import { reducer as settings } from "ducks/settings";
import { reducer as trustAsset } from "ducks/trustAsset";
import { reducer as untrustedAssets } from "ducks/untrustedAssets";
import { reducer as custodial } from "ducks/custodial";

const RESET_STORE_ACTION_TYPE = "RESET";
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

const isSerializable = (value: any) => {
  // activeAsset has callback function and description can be a component
  if (typeof value === "function" || typeof value === "symbol") {
    return true;
  }

  return BigNumber.isBigNumber(value) || isPlain(value);
};

const reducers = combineReducers({
  account,
  activeAsset,
  allAssets,
  assetOverrides,
  claimableBalances,
  claimAsset,
  custodial,
  logs,
  sendPayment,
  sep6DepositAsset,
  sep6WithdrawAsset,
  sep8Send,
  sep24DepositAsset,
  sep24WithdrawAsset,
  sep31Send,
  sep38Quotes,
  settings,
  trustAsset,
  untrustedAssets,
});

export const resetStoreAction = createAction(RESET_STORE_ACTION_TYPE);

const rootReducer = (state: CombinedState<any>, action: Action) => {
  const newState = action.type === RESET_STORE_ACTION_TYPE ? undefined : state;
  return reducers(newState, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        isSerializable,
      },
    }),
});

export const walletBackendEndpoint: string =
  window._env_.WALLET_BACKEND_ENDPOINT ?? "";
export const clientDomain: string = window._env_.CLIENT_DOMAIN ?? "";
