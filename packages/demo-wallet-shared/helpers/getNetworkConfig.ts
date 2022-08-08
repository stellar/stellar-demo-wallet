import StellarSdk from "stellar-sdk";
import { NetworkType } from "../types/types";

interface NetworkItemConfig {
  network: string;
  url: string;
}

interface NetworkConfig {
  testnet: NetworkItemConfig;
}

const networkConfig: NetworkConfig = {
  testnet: {
    network: StellarSdk.Networks.TESTNET,
    url: "https://horizon-testnet.stellar.org",
  },
};

export const getNetworkConfig = () => networkConfig[NetworkType.TESTNET];
