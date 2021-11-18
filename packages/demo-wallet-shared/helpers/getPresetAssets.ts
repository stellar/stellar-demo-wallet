import { PRESET_ASSETS } from "../constants/presetAssets";
import { Asset } from "../types/types";

export const getPresetAssets = (allAssets: Asset[]) => {
  const newPresetAssets = PRESET_ASSETS.filter(
    (pAsset) =>
      !allAssets.some(
        (a) =>
          a.assetCode === pAsset.assetCode &&
          (a.homeDomain === pAsset.homeDomain ||
            a.assetIssuer === pAsset.issuerPublicKey),
      ),
  );
  return newPresetAssets;
};
