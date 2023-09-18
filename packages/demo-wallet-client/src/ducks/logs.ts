import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { ActionStatus, LogItemProps, LogsInitialState } from "types/types";

const initialState: LogsInitialState = {
  errorString: "",
  items: [],
  status: undefined,
};

export const addLogAction = createAsyncThunk<LogItemProps, LogItemProps>(
  "logs/addLog",
  (logItem) => logItem,
);

const logsSlice = createSlice({
  name: "logs",
  initialState,
  reducers: {
    clearLogsAction: () => initialState,
    logAction: (state, action: PayloadAction<LogItemProps>) => {
      state.items = [...state.items, action.payload];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(addLogAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(addLogAction.fulfilled, (state, action) => {
      // Make sure we're not duplicating logs
      const currentLogId = `${action.payload.type}-${action.payload.title}`;
      const previousLog = [...state.items]?.pop();
      const previousLogId = `${previousLog?.type}-${previousLog?.title}`;

      if (currentLogId !== previousLogId) {
        state.items = [...state.items, action.payload];
      }
      state.status = ActionStatus.SUCCESS;
    });
  },
});

export const logsSelector = (state: RootState) => state.logs;

export const { reducer } = logsSlice;
export const { logAction, clearLogsAction } = logsSlice.actions;
