import StellarSdk from "stellar-sdk";

export const getNetworkConfig = () => ({
  network: window._env_.HORIZON_PASSPHRASE || StellarSdk.Networks.TESTNET,
  url: window._env_.HORIZON_URL || "https://horizon-testnet.stellar.org",
});
