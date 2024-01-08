import { Horizon } from "stellar-sdk";
import { getAssetSettingsFromToml } from "./getAssetSettingsFromToml";
import { isNativeAsset } from "./isNativeAsset";
import { log } from "./log";
import { normalizeAssetProps } from "./normalizeAssetProps";
import { Asset, AssetType, SearchParamAsset } from "../types/types";

type GetAssetOverridesDataProps = {
  assetOverrides: SearchParamAsset[];
  networkUrl: string;
  untrustedAssets: string[];
};

export const getAssetOverridesData = async ({
  assetOverrides,
  networkUrl,
  untrustedAssets,
}: GetAssetOverridesDataProps) => {
  if (!assetOverrides.length) {
    return [];
  }

  let response: Asset[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < assetOverrides.length; i++) {
    const { assetString, homeDomain } = assetOverrides[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    const server = new Horizon.Server(networkUrl);
    const isNative = isNativeAsset(assetCode);
    let assetResponse;

    if (!isNative) {
      // eslint-disable-next-line no-await-in-loop
      assetResponse = await server
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
      assetType: isNative
        ? AssetType.NATIVE
        : assetResponse?.records[0]?.asset_type,
      homeDomain,
      isOverride: true,
      isUntrusted: untrustedAssets.includes(assetString),
      supportedActions,
    });

    response = [...response, data];
  }

  return response;
};
