import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { ExtraInitialState } from "types/types.d";

const initialState: ExtraInitialState = {};

const extraSlice = createSlice({
  name: "extra",
  initialState,
  reducers: {
    updateExtraAction: (
      state,
      action: PayloadAction<{ category: string; param: string; value: string }>,
    ) => {
      const currentCatItems = state[action.payload.category] || {};

      return {
        ...state,
        [action.payload.category]: {
          ...currentCatItems,
          [action.payload.param]: action.payload.value,
        },
      };
    },
    removeExtraAction: (state, action: PayloadAction<string>) => {
      const newState = { ...state };

      if (newState[action.payload]) {
        delete newState[action.payload];
      }

      return newState;
    },
  },
});

export const extraSelector = (state: RootState) => state.extra;

export const { reducer } = extraSlice;
export const { updateExtraAction, removeExtraAction } = extraSlice.actions;
