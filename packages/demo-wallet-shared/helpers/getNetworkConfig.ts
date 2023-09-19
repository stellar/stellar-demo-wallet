import { Networks } from "stellar-sdk";

export const getNetworkConfig = () => {
  return {
    network: window._env_.HORIZON_PASSPHRASE || Networks.TESTNET,
    url: window._env_.HORIZON_URL || "https://horizon-testnet.stellar.org",
  };
};
