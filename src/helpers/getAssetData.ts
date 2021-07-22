import { Types } from "@stellar/wallet-sdk";
import { getAssetSettingsFromToml } from "helpers/getAssetSettingsFromToml";
import { normalizeAssetProps } from "helpers/normalizeAssetProps";
import { Asset } from "types/types.d";

export const getAssetData = async ({
  balances,
  networkUrl,
}: {
  balances: Types.BalanceMap;
  networkUrl: string;
}) => {
  const allAssets = Object.entries(balances);
  const assets: Asset[] = [];

  if (!allAssets?.length) {
    return assets;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-for-of
  for (let i = 0; i < allAssets.length; i++) {
    const [assetId, data] = allAssets[i];

    // eslint-disable-next-line no-await-in-loop
    const { homeDomain, supportedActions } = await getAssetSettingsFromToml({
      assetId,
      networkUrl,
    });

    assets.push(
      normalizeAssetProps({
        source: data,
        homeDomain,
        supportedActions,
      }),
    );
  }

  return assets;
};
