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
import { reducer as sendPayment } from "ducks/sendPayment";
import { reducer as settings } from "ducks/settings";
import { reducer as trustAsset } from "ducks/trustAsset";
import { reducer as untrustedAssets } from "ducks/untrustedAssets";

const RESET_STORE_ACTION_TYPE = "REST";

export type RootState = ReturnType<typeof store.getState>;

const loggerMiddleware = (store: any) => (next: any) => (
  action: Action<any>,
) => {
  console.log("Dispatching: ", action.type);
  const dispatchedAction = next(action);
  console.log("NEW STATE: ", store.getState());
  return dispatchedAction;
};

const isSerializable = (value: any) =>
  BigNumber.isBigNumber(value) || isPlain(value);

const reducers = combineReducers({
  account,
  sendPayment,
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
  middleware: [
    ...getDefaultMiddleware({
      serializableCheck: {
        isSerializable,
      },
    }),
    loggerMiddleware,
  ],
});
