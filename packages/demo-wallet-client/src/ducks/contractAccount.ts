import { createAsyncThunk } from "@reduxjs/toolkit";
import { AccountKeyPair, RejectMessage } from "../types/types";
import { RootState } from "../config/store";
import { log } from "demo-wallet-shared/build/helpers/log";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { SmartWalletService } from "../services/SmartWalletService";

export const createPasskeyContract = createAsyncThunk<
  { contractId: string; keyId: string; sourceAccount: AccountKeyPair },
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
      sourceAccount: result.sourceAccount,
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