import { createAsyncThunk } from "@reduxjs/toolkit";
import { RejectMessage } from "../types/types";
import { RootState } from "../config/store";
import { log } from "demo-wallet-shared/build/helpers/log";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { SmartWalletService } from "../services/SmartWalletService";

export const createPasskeyContract = createAsyncThunk<
  { contractId: string; keyId: string; },
  string,
  { rejectValue: RejectMessage; state: RootState }
>("contractAccount/createPasskeyContract", async (passkeyName, { rejectWithValue }) => {
  try {
    log.instruction({ title: "Deploying new contract" });
    const swService = SmartWalletService.getInstance();
    const result = await swService.createPasskeyContract(passkeyName);
    return {
      contractId: result.contractId,
      keyId: result.pkId,
    };
  } catch (error) {
    log.error({
      title: "Deploying new contract failed",
      body: getErrorMessage(error),
    });
    return rejectWithValue({
      errorString:
        "Something went wrong while creating contract account, please try again.",
    });
  }
});

export const connectPasskeyContract = createAsyncThunk<
  { contractId: string; keyId: string; },
  void,
  { rejectValue: RejectMessage; state: RootState }
>(
  "contractAccount/connectPasskeyContract",
  async (_, { rejectWithValue }) => {
    try {
      log.instruction({ title: "Connecting contract" });
      const swService = SmartWalletService.getInstance();
      const result = await swService.connectPasskeyContract();
      return {
        contractId: result.contractId,
        keyId: result.pkId,
      };
    } catch (error) {
      log.error({
        title: "Connecting contract failed",
        body: getErrorMessage(error),
      });
      return rejectWithValue({
        errorString:
          "Something went wrong while connecting account, please try again.",
      });
    }
  }
);