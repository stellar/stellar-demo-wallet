import StellarSdk from "stellar-sdk";

export const getNetworkConfig = () => ({
  network:
    process.env.REACT_APP_HORIZON_PASSPHRASE ?? StellarSdk.Networks.TESTNET,
  url:
    process.env.REACT_APP_HORIZON_URL ?? "https://horizon-testnet.stellar.org",
});
