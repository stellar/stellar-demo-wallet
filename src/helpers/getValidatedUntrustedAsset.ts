import { Types } from "@stellar/wallet-sdk";
import { getIssuerFromDomain } from "helpers/getIssuerFromDomain";
import { log } from "helpers/log";

interface GetUntrustedAssetProps {
  assetCode: string;
  assetIssuer?: string;
  homeDomain?: string;
  accountBalances?: Types.BalanceMap;
}

export const getValidatedUntrustedAsset = async ({
  assetCode,
  assetIssuer,
  homeDomain,
  accountBalances,
}: GetUntrustedAssetProps) => {
  log.instruction({
    title: `Start validating untrusted asset ${assetCode}`,
  });

  if (!assetCode && !(assetIssuer || homeDomain)) {
    log.error({ title: "REQUIRED: asset code AND (home domain OR issuer)" });
    throw new Error("REQUIRED: asset code AND (home domain OR issuer)");
  }

  let asset;

  if (assetIssuer) {
    asset = `${assetCode}:${assetIssuer}`;
  } else if (homeDomain) {
    try {
      const homeDomainIssuer = await getIssuerFromDomain({
        assetCode,
        homeDomain,
      });

      asset = `${assetCode}:${homeDomainIssuer}`;
    } catch (e) {
      log.error({ title: "Issuer domain error: ", body: e.toString() });
      throw new Error(e.toString());
    }
  }

  if (!asset) {
    log.error({
      title: `Something went wrong with the asset ${asset}. Make sure home domain or asset issuer is correct.`,
    });
    throw new Error(
      `Something went wrong with the asset ${asset}. Make sure home domain or asset issuer is correct.`,
    );
  }

  // Is asset already trusted
  if (accountBalances?.[asset]) {
    log.instruction({ title: `Asset ${asset} is already trusted.` });
    throw new Error(`Asset ${asset} is already trusted.`);
  }

  return asset;
};
