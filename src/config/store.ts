import {
  configureStore,
  getDefaultMiddleware,
  isPlain,
  createAction,
  CombinedState,
} from "@reduxjs/toolkit";
import { combineReducers, Action } from "redux";
import BigNumber from "bignumber.js";

import { reducer as account } from "ducks/account";
import { reducer as claimAsset } from "ducks/claimAsset";
import { reducer as claimableBalances } from "ducks/claimableBalances";
import { reducer as depositAsset } from "ducks/depositAsset";
import { reducer as logs } from "ducks/logs";
import { reducer as sendPayment } from "ducks/sendPayment";
import { reducer as sendSep31 } from "ducks/sendSep31";
import { reducer as settings } from "ducks/settings";
import { reducer as trustAsset } from "ducks/trustAsset";
import { reducer as untrustedAssets } from "ducks/untrustedAssets";
import { reducer as withdrawAsset } from "ducks/withdrawAsset";

const RESET_STORE_ACTION_TYPE = "RESET";
export type RootState = ReturnType<typeof store.getState>;

const isSerializable = (value: any) =>
  BigNumber.isBigNumber(value) || isPlain(value);

const reducers = combineReducers({
  account,
  claimAsset,
  claimableBalances,
  depositAsset,
  logs,
  sendPayment,
  sendSep31,
  settings,
  trustAsset,
  untrustedAssets,
  withdrawAsset,
});

export const resetStoreAction = createAction(RESET_STORE_ACTION_TYPE);

const rootReducer = (state: CombinedState<any>, action: Action) => {
  const newState = action.type === RESET_STORE_ACTION_TYPE ? undefined : state;
  return reducers(newState, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: [
    ...getDefaultMiddleware({
      serializableCheck: {
        isSerializable,
      },
    }),
  ],
});
