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
    throw new Error("Asset was already added");
  } else {
    queryParams.set("untrustedAssets", `${untrustedAssetsParam},${asset}`);
  }

  return `?${queryParams.toString()}`;
};
