import { Api } from "@stellar/stellar-sdk/rpc";

export const SOROBAN_CONFIG = {
  MAX_FEE: "10000",
  ONE: 10 ** 7, // Stroops in 1
  WASM_HASH: "81d56ff8e2d8ea10a8ddafd68265fc51bf5a3838e775a06c3d0f94ba52c8095f",
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