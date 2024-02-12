import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { ExtraCategory, ExtraInitialState } from "types/types";

const initialState: ExtraInitialState = {};

const extraSlice = createSlice({
  name: "extra",
  initialState,
  reducers: {
    updateExtraAction: (
      state,
      action: PayloadAction<{
        category: ExtraCategory;
        param: string;
        value: string;
      }>,
    ) => {
      let currentCatItems = state[action.payload.category] || {};

      // Removing param from the category if it has no value
      if (!action.payload.value) {
        currentCatItems = Object.entries(currentCatItems).reduce(
          (prev, [param, value]) => {
            if (param !== action.payload.param) {
              return { ...prev, [param]: value };
            }

            return prev;
          },
          {},
        );
      }

      return {
        ...state,
        [action.payload.category]: {
          ...currentCatItems,
          ...(action.payload.value
            ? { [action.payload.param]: action.payload.value }
            : {}),
        },
      };
    },
    removeExtraAction: (state, action: PayloadAction<ExtraCategory[]>) => {
      const newState = { ...state };

      action.payload.forEach((a) => {
        if (newState[a]) {
          delete newState[a];
        }
      });

      return newState;
    },
  },
});

export const extraSelector = (state: RootState) => state.extra;

export const { reducer } = extraSlice;
export const { updateExtraAction, removeExtraAction } = extraSlice.actions;
