import { log } from "helpers/log";

export const getUntrustedAssetsSearchParam = ({
  location,
  asset,
}: {
  // TODO: location type
  location: any;
  asset: string;
}) => {
  const queryParams = new URLSearchParams(location.search);
  const untrustedAssetsParam = queryParams.get("untrustedAssets");

  if (!untrustedAssetsParam) {
    queryParams.set("untrustedAssets", asset);
  } else if (untrustedAssetsParam.includes(asset)) {
    const errorMessage = `Asset ${asset} was already added`;

    log.error({ title: errorMessage });
    throw new Error(errorMessage);
  } else {
    queryParams.set("untrustedAssets", `${untrustedAssetsParam},${asset}`);
  }

  return `?${queryParams.toString()}`;
};
