import { Horizon } from "stellar-sdk";
import { getToml } from "../methods/getToml";
import { AssetSupportedActions, AnyObject, AssetType } from "../types/types";

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
  supportedActions: AssetSupportedActions | AnyObject;
}> => {
  const server = new Horizon.Server(networkUrl);
  const isNative = assetId === AssetType.NATIVE;

  // Other assets
  let supportedActions: AssetSupportedActions | AnyObject = {};
  const [, assetIssuer] = assetId.split(":");
  let homeDomain = homeDomainOverride;

  if (!homeDomainOverride && !isNative) {
    const accountRecord = await server.loadAccount(assetIssuer);
    homeDomain = accountRecord.home_domain;
  }

  if (homeDomain) {
    const toml = await getToml(homeDomain);
    const {
      CURRENCIES,
      TRANSFER_SERVER,
      TRANSFER_SERVER_SEP0024,
      DIRECT_PAYMENT_SERVER,
    } = toml;

    supportedActions = {
      sep6: Boolean(TRANSFER_SERVER),
      sep8: !isNative && isSep8Asset({ assetId, currencies: CURRENCIES }),
      sep24: Boolean(TRANSFER_SERVER_SEP0024),
      sep31: Boolean(DIRECT_PAYMENT_SERVER),
    };
  }

  return {
    homeDomain,
    ...{ supportedActions },
  };
};

const isSep8Asset = ({
  currencies,
  assetId,
}: {
  currencies: any;
  assetId: string;
}): boolean => {
  const [assetCode, assetIssuer] = assetId.split(":");

  const currency = (currencies as any[]).find(
    (c) => c.code === assetCode && c.issuer === assetIssuer,
  );

  return Boolean(currency?.regulated);
};
