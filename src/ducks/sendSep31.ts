import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
// import { DataProvider, Types } from "@stellar/wallet-sdk";
// import { Keypair } from "stellar-sdk";

import { RootState } from "config/store";
import { settingsSelector } from "ducks/settings";
// import { getErrorString } from "helpers/getErrorString";
// import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { checkToml } from "methods/sep31Send/checkToml";
import { ActionStatus, RejectMessage } from "types/types.d";

export const fetchSendFieldsAction = createAsyncThunk<
  // TODO: any types
  any,
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sendSep31/fetchSendFieldsAction",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { homeDomain, pubnet } = settingsSelector(getState());

      log.instruction({ title: "Initiate a direct payment request" });

      const tomlResponse = await checkToml({ homeDomain, pubnet });
      const { authEndpoint, sendServer, kycServer } = tomlResponse;

      console.log("authEndpoint: ", authEndpoint);
      console.log("sendServer: ", sendServer);
      console.log("kycServer: ", kycServer);

      // TODO: return
      return {
        toml: tomlResponse,
      };
    } catch (error) {
      log.error({
        title: error.toString(),
      });

      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

// TODO: any type
const initialState: any = {
  toml: {
    authEndpoint: "",
    sendServer: "",
    kycServer: "",
  },
  status: undefined,
};

const sendSep31Slice = createSlice({
  name: "sendSep31",
  initialState,
  reducers: {
    resetSendSep31Action: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchSendFieldsAction.pending, (state = initialState) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(fetchSendFieldsAction.fulfilled, (state, action) => {
      state.toml = action.payload.toml;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(fetchSendFieldsAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sendSep31Selector = (state: RootState) => state.sendSep31;

export const { reducer } = sendSep31Slice;
export const { resetSendSep31Action } = sendSep31Slice.actions;
