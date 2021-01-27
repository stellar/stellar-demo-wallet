export const removeUntrustedAssetSearchParam = ({
  location,
  removeAsset,
}: {
  // TODO: location type
  location: any;
  removeAsset: string;
}) => {
  const queryParams = new URLSearchParams(location.search);
  const untrustedAssetsParam = queryParams.get("untrustedAssets");

  if (untrustedAssetsParam) {
    const assetsList = untrustedAssetsParam.split(",");
    const assetsToKeep = assetsList.filter((asset) => asset !== removeAsset);

    if (assetsToKeep.length) {
      queryParams.set("untrustedAssets", assetsToKeep.join(","));
    } else {
      queryParams.delete("untrustedAssets");
    }
  }

  return `?${queryParams.toString()}`;
};
