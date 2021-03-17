import { Server } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { getAssetSettingsFromToml } from "helpers/getAssetSettingsFromToml";
import { normalizeAssetProps } from "helpers/normalizeAssetProps";
import { log } from "helpers/log";
import { Asset } from "types/types.d";

interface GetUntrustedAssetDataProps {
  assetsToAdd: string[];
  accountAssets?: Types.BalanceMap;
  networkUrl: string;
}

export const getUntrustedAssetData = async ({
  assetsToAdd,
  accountAssets,
  networkUrl,
}: GetUntrustedAssetDataProps) => {
  log.instruction({ title: "Start getting asset record" });

  if (!assetsToAdd.length) {
    log.instruction({ title: `No assets to fetch.` });
  }

  let response: Asset[] = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < assetsToAdd.length; i++) {
    const assetString = assetsToAdd[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    if (accountAssets?.[assetString]) {
      log.instruction({ title: `Asset ${assetString} is already trusted` });
      break;
    }

    log.request({ title: `Fetching asset ${assetString} record` });

    const server = new Server(networkUrl);

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records?.length) {
      log.error({ title: `Asset ${assetString} does not exist.` });
    } else {
      log.response({
        title: `Asset ${assetString} record fetched`,
        body: assetResponse.records[0],
      });

      // eslint-disable-next-line no-await-in-loop
      const { homeDomain, supportedActions } = await getAssetSettingsFromToml({
        assetId: assetString,
        networkUrl,
      });

      // eslint-disable-next-line no-await-in-loop
      const data = normalizeAssetProps({
        assetCode,
        assetIssuer,
        assetType: assetResponse.records[0].asset_type,
        homeDomain,
        supportedActions,
        isUntrusted: true,
      });

      response = [...response, data];
    }
  }

  return response;
};
