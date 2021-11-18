import { Asset, SearchParamAsset } from "../types/types";

export const updateAssetsInStore = (
  currentAssets: Asset[],
  assetsToUpdate: SearchParamAsset[],
) =>
  currentAssets.reduce((result: Asset[], asset) => {
    const foundAsset = assetsToUpdate.find(
      (a) => a.assetString === asset.assetString,
    );

    if (foundAsset) {
      return [...result, { ...asset, ...foundAsset }];
    }

    return [...result, asset];
  }, []);
