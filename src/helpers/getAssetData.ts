import { Types } from "@stellar/wallet-sdk";
import { getAssetSettingsFromToml } from "helpers/getAssetSettingsFromToml";

// TODO: add logs
export const getAssetData = async ({
  balances,
  networkUrl,
}: {
  balances: Types.BalanceMap;
  networkUrl: string;
}) => {
  const allAssets = Object.entries(balances);
  const assets: {
    [key: string]: Types.AssetBalance | Types.NativeBalance;
  } = {};

  if (!allAssets?.length) {
    return assets;
  }

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < allAssets.length; i++) {
    const [assetId, data] = allAssets[i];

    // eslint-disable-next-line no-await-in-loop
    assets[assetId] = await getAssetSettingsFromToml<
      Types.AssetBalance | Types.NativeBalance
    >({
      assetId,
      data,
      networkUrl,
    });
  }

  return assets;
};
