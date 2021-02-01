import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { LogItem, LogsInitialState } from "types/types.d";

const initialState: LogsInitialState = {
  items: [],
};

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    clearLogsAction: () => initialState,
    logAction: (state, action: PayloadAction<LogItem>) => {
      state.items = [...state.items, action.payload];
    },
  },
});

export const logsSelector = (state: RootState) => state.logs;

export const { reducer } = logsSlice;
export const { logAction, clearLogsAction } = logsSlice.actions;
