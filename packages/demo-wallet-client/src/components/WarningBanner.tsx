import StellarSdk from "stellar-sdk";
import { StatusBar } from "@stellar/design-system";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";

export const WarningBanner = () => {
  const { network } = getNetworkConfig();

  // Show banner if not on testnet (changed in .env)
  if (network && network !== StellarSdk.Networks.TESTNET) {
    return (
      <StatusBar variant={StatusBar.variant.warning}>
        WARNING: You’ve connected a real account to this demo. You are not on
        the test server. Any actions you take here will affect actual assets.
      </StatusBar>
    );
  }

  return null;
};
