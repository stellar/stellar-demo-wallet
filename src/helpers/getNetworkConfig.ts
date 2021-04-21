import StellarSdk from "stellar-sdk";
import { NetworkType } from "types/types.d";

interface NetworkItemConfig {
  network: string;
  url: string;
}

interface NetworkConfig {
  public: NetworkItemConfig;
  testnet: NetworkItemConfig;
}

const networkConfig: NetworkConfig = {
  testnet: {
    network: StellarSdk.Networks.TESTNET,
    url: "https://horizon-testnet.stellar.org",
  },
  public: {
    network: StellarSdk.Networks.PUBLIC,
    url: "https://horizon.stellar.org",
  },
};

export const getNetworkConfig = (pubnet: boolean) => {
  const network = pubnet ? NetworkType.PUBLIC : NetworkType.TESTNET;
  return networkConfig[network];
};
