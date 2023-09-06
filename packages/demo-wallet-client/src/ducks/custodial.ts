import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { CustodialInitialState, AnyObject } from "types/types";

const initialState: CustodialInitialState = {
  isEnabled: false,
  secretKey: "",
  publicKey: "",
  memoId: "",
};

const custodialSlice = createSlice({
  name: "custodial",
  initialState,
  reducers: {
    resetCustodialAction: () => initialState,
    updateCustodialAction: (state, action: PayloadAction<AnyObject>) => ({
      ...state,
      ...action.payload,
    }),
  },
});

export const custodialSelector = (state: RootState) => state.custodial;

export const { reducer } = custodialSlice;
export const { updateCustodialAction, resetCustodialAction } =
  custodialSlice.actions;
