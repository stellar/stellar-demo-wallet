import { Types } from "@stellar/wallet-sdk";
import { log } from "helpers/log";
import { UntrustedAsset } from "types/types.d";

interface GetAssetRecordProps {
  assetsToAdd: string[];
  accountAssets?: Types.BalanceMap;
  server: any;
}

export const getAssetRecord = async ({
  assetsToAdd,
  accountAssets,
  server,
}: GetAssetRecordProps) => {
  log.instruction({ title: "Start getting asset record" });

  if (!assetsToAdd.length) {
    log.instruction({ title: `No assets to fetch.` });
  }

  let response: UntrustedAsset[] = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < assetsToAdd.length; i++) {
    const assetString = assetsToAdd[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    if (accountAssets?.[assetString]) {
      log.instruction({ title: `Asset ${assetString} is already trusted` });
      break;
    }

    log.request({ url: `Fetching asset ${assetString} record` });

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records) {
      log.error({ title: `Asset ${assetString} does not exist.` });
    } else {
      log.response({
        url: `Asset ${assetString} record fetched`,
        body: assetResponse.records[0],
      });

      response = [
        ...response,
        {
          assetString,
          assetCode,
          assetIssuer,
          balance: "0.0000000",
          assetType: assetResponse.records[0].asset_type,
          untrusted: true,
        },
      ];
    }
  }

  return response;
};
