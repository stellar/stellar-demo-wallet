import { Api } from "@stellar/stellar-sdk/rpc";
import { ContractAccountDetails } from "../types/types";

export const SOROBAN_CONFIG = {
  MAX_FEE: "10000",
  ONE: 10 ** 7, // Stroops in 1
  RPC_URL: "https://soroban-testnet.stellar.org",
  WASM_HASH: "03dbb8b88b981e944ae44f48edba5a39c8351ea8c84959b92707108837654f6f",
} as const;

export const STELLAR_EXPERT_API = "https://api.stellar.expert/explorer/testnet";

export const SendTxStatus: {
  [index: string]: Api.SendTransactionStatus;
} = {
  Pending: "PENDING",
  Duplicate: "DUPLICATE",
  Retry: "TRY_AGAIN_LATER",
  Error: "ERROR",
};

// -----------------------------------------------------------------------------
// Temporary test constants for development and testing purposes only.
// These will be removed or replaced when the project is complete.
// -----------------------------------------------------------------------------

export const SOURCE_KEYPAIR_SECRET = "SDIHUAHOUBN5G4GBM276BVG7JYVFTCJYRCDK2ZI37IJ5KRX7LFRRIQNV"

export const testInfo: ContractAccountDetails = {
  "contract": "CCTEQXG5UDAENEM6EZEDBF6S4DYI6LENXUWWI5FQFKKSKNF4JSPTM5JA",
  "account": "CCTEQXG5UDAENEM6EZEDBF6S4DYI6LENXUWWI5FQFKKSKNF4JSPTM5JA",
  "created": 1747011297,
  "creator": "GBL5LTAAODO3GXX3MGUUCST42ZHFNGL7OGARCO47E7PVQBTP2V6PNW44",
  "payments": 0,
  "trades": 0,
  "wasm": "e5da3b9950524b4276ccf2051e6cc8220bb581e869b892a6ff7812d7709c7a50",
  "storage_entries": 1,
  "validation": {
    "status": "unverified"
  },
  "functions": [
    {
      "invocations": 1,
      "subinvocations": 0,
      "function": "__constructor"
    }
  ]
}