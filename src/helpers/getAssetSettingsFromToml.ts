import { Server } from "stellar-sdk";
import { getToml } from "methods/getToml";
import { AssetSupportedActions, AnyObject } from "types/types.d";

interface GetAssetSettingsFromToml<T> {
  assetId: string;
  data: T;
  networkUrl: string;
}

export const getAssetSettingsFromToml = async <T>({
  assetId,
  data,
  networkUrl,
}: GetAssetSettingsFromToml<T>) => {
  const server = new Server(networkUrl);

  // Native (XLM) asset
  if (assetId === "native") {
    return data;
  }

  // Other assets
  let supportedActions: AssetSupportedActions | AnyObject = {};
  const [, assetIssuer] = assetId.split(":");
  const accountRecord = await server.loadAccount(assetIssuer);
  const homeDomain = accountRecord.home_domain;

  if (homeDomain) {
    const toml = await getToml(homeDomain);
    const {
      TRANSFER_SERVER,
      TRANSFER_SERVER_SEP0024,
      DIRECT_PAYMENT_SERVER,
    } = toml;

    supportedActions = {
      homeDomain,
      sep6: Boolean(TRANSFER_SERVER),
      sep24: Boolean(TRANSFER_SERVER_SEP0024),
      sep31: Boolean(DIRECT_PAYMENT_SERVER),
    };
  }

  return {
    ...data,
    ...{ supportedActions },
  };
};
