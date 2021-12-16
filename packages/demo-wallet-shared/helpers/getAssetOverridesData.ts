import { Server } from "stellar-sdk";
import { getAssetSettingsFromToml } from "./getAssetSettingsFromToml";
import { log } from "./log";
import { normalizeAssetProps } from "./normalizeAssetProps";
import { Asset, SearchParamAsset } from "../types/types";

type GetAssetOverridesDataProps = {
  assetOverrides: SearchParamAsset[];
  networkUrl: string;
};

export const getAssetOverridesData = async ({
  assetOverrides,
  networkUrl,
}: GetAssetOverridesDataProps) => {
  if (!assetOverrides.length) {
    return [];
  }

  let response: Asset[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < assetOverrides.length; i++) {
    const { assetString, homeDomain } = assetOverrides[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    const server = new Server(networkUrl);

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records.length) {
      log.error({
        title: `Asset \`${assetString}\` does not exist.`,
      });
      break;
    }

    // eslint-disable-next-line no-await-in-loop
    const { supportedActions } = await getAssetSettingsFromToml({
      assetId: assetString,
      networkUrl,
      homeDomainOverride: homeDomain,
    });

    // eslint-disable-next-line no-await-in-loop
    const data = normalizeAssetProps({
      assetCode,
      assetIssuer,
      assetType: assetResponse.records[0].asset_type,
      homeDomain,
      supportedActions,
    });

    response = [...response, data];
  }

  return response;
};
