import { Server } from "stellar-sdk";
import { getToml } from "methods/getToml";
import { AssetSupportedActions, AnyObject, AssetType } from "types/types.d";

interface GetAssetSettingsFromToml {
  assetId: string;
  networkUrl: string;
  homeDomainOverride?: string;
}

export const getAssetSettingsFromToml = async ({
  assetId,
  networkUrl,
  homeDomainOverride,
}: GetAssetSettingsFromToml): Promise<{
  homeDomain: string | undefined;
  supportedActions: AssetSupportedActions | {};
}> => {
  const server = new Server(networkUrl);

  // Native (XLM) asset
  if (assetId === AssetType.NATIVE) {
    return {
      homeDomain: undefined,
      supportedActions: {},
    };
  }

  // Other assets
  let supportedActions: AssetSupportedActions | AnyObject = {};
  const [, assetIssuer] = assetId.split(":");
  let homeDomain = homeDomainOverride;

  if (!homeDomainOverride) {
    const accountRecord = await server.loadAccount(assetIssuer);
    homeDomain = accountRecord.home_domain;
  }

  if (homeDomain) {
    const toml = await getToml(homeDomain);
    const {
      TRANSFER_SERVER,
      TRANSFER_SERVER_SEP0024,
      DIRECT_PAYMENT_SERVER,
    } = toml;

    supportedActions = {
      sep6: Boolean(TRANSFER_SERVER),
      sep24: Boolean(TRANSFER_SERVER_SEP0024),
      sep31: Boolean(DIRECT_PAYMENT_SERVER),
    };
  }

  return {
    homeDomain,
    ...{ supportedActions },
  };
};
