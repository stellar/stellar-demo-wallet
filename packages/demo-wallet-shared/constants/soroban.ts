import { Api } from "@stellar/stellar-sdk/rpc";

export const SOROBAN_CONFIG = {
  MAX_FEE: "10000",
  ONE: 10 ** 7, // Stroops in 1
  WASM_HASH: "03dbb8b88b981e944ae44f48edba5a39c8351ea8c84959b92707108837654f6f",
} as const;

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

export const SOURCE_KEYPAIR_SECRET = "SDIHUAHOUBN5G4GBM276BVG7JYVFTCJYRCDK2ZI37IJ5KRX7LFRRIQNV"; 