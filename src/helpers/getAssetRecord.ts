import { log } from "helpers/log";
import { UntrustedAsset } from "types/types.d";

export const getAssetRecord = async (assets: string[], server: any) => {
  log.instruction({ title: "Start getting asset record" });

  if (!assets.length) {
    log.instruction({ title: `No assets to fetch.` });
  }

  let response: UntrustedAsset[] = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < assets.length; i++) {
    const assetString = assets[i];
    const [assetCode, assetIssuer] = assetString.split(":");

    log.instruction({ title: `Fetching asset ${assetString} record` });

    // eslint-disable-next-line no-await-in-loop
    const assetResponse = await server
      .assets()
      .forCode(assetCode)
      .forIssuer(assetIssuer)
      .call();

    if (!assetResponse.records) {
      log.error({ title: `Asset ${assetString} does not exist.` });
    } else {
      log.instruction({
        title: `Asset ${assetString} record fetched`,
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
