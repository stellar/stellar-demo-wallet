import { Asset, PresetAsset } from "../types/types";

export const getPresetAssets = (allAssets: Asset[], presetAssets:  PresetAsset[]) => {
  return presetAssets.filter(
    (pAsset) =>
      !allAssets.some(
        (a) =>
          a.assetCode === pAsset.assetCode &&
          (a.homeDomain === pAsset.homeDomain ||
            a.assetIssuer === pAsset.issuerPublicKey),
      ),
  );
};
