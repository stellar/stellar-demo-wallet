import { Networks, BASE_FEE } from "@stellar/stellar-sdk";

export const getNetworkConfig = () => {
  return {
    network: window._env_.HORIZON_PASSPHRASE || Networks.TESTNET,
    url: window._env_.HORIZON_URL || "https://horizon-testnet.stellar.org",
    baseFee: process?.env?.REACT_APP_BASE_FEE || BASE_FEE,
    rpcNetwork: window._env_.RPC_PASSPHRASE || Networks.TESTNET,
    rpcUrl: window._env_.RPC_URL || "https://soroban-testnet.stellar.org",
  };
};
