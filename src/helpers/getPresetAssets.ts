import { presetAsset, PRESET_ASSETS } from "constants/presetAssets";
import { Asset } from "types/types";

export const getPresetAssets = (allAssets: Asset[]) => {
  const newPresetAssets: presetAsset[] = [];

  PRESET_ASSETS.forEach((pAsset) => {
    const alreadyContainsAsset = allAssets.some(
      (a) =>
        a.assetCode === pAsset.assetCode &&
        (a.homeDomain === pAsset.homeDomain ||
          a.assetIssuer === pAsset.issuerPublicKey),
    );
    if (!alreadyContainsAsset) {
      newPresetAssets.push(pAsset);
    }
  });

  return newPresetAssets;
};
