import { Horizon } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { getAssetSettingsFromToml } from "./getAssetSettingsFromToml";
import { normalizeAssetProps } from "./normalizeAssetProps";
import { log } from "./log";
import { Asset } from "../types/types";

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
  if (!assetsToAdd.length) {
    log.instruction({ title: `No assets to fetch` });
  }

  let response: Asset[] = [];

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < assetsToAdd.length; i++) {
    const assetString = assetsToAdd[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    if (accountAssets?.[assetString]) {
      log.instruction({ title: `Asset \`${assetString}\` is already trusted` });
      // eslint-disable-next-line no-continue
      continue;
    }

    log.request({ title: `Fetching asset \`${assetString}\` record` });

    const server = new Horizon.Server(networkUrl);

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records.length) {
      log.error({
        title: `Asset \`${assetString}\` does not exist`,
      });

      response = [
        ...response,
        {
          assetString,
          assetCode,
          assetIssuer,
          assetType: "none",
          total: "0",
          notExist: true,
          source: {},
        },
      ];
    } else {
      log.response({
        title: `Asset \`${assetString}\` record fetched`,
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

      log.instruction({
        title: `Asset \`${assetString}\` added`,
      });
    }
  }

  return response;
};
