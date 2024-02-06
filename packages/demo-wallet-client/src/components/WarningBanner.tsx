import { Networks } from "stellar-sdk";
import { StatusBar } from "@stellar/design-system";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";

export const WarningBanner = () => {
  const { network, url } = getNetworkConfig();

  if (!network || network === Networks.TESTNET) {
    return null;
  }

  const message =
    network === Networks.PUBLIC
      ? "You’ve connected a real account to this demo. You are not on the test server. Any actions you take here will affect actual assets."
      : `You’ve connected to ${url}`;

  return (
    <StatusBar
      variant={StatusBar.variant.warning}
    >{`WARNING: ${message}`}</StatusBar>
  );
};
