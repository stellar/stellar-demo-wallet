import { Types } from "@stellar/wallet-sdk";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getIssuerFromDomain } from "helpers/getIssuerFromDomain";
import { log } from "helpers/log";

interface GetUntrustedAssetProps {
  assetCode: string;
  homeDomain: string;
  accountBalances?: Types.BalanceMap;
}

export const getValidatedUntrustedAsset = async ({
  assetCode,
  homeDomain,
  accountBalances,
}: GetUntrustedAssetProps) => {
  log.instruction({
    title: `Start validating untrusted asset ${assetCode}`,
  });

  if (!assetCode && !homeDomain) {
    log.error({ title: "REQUIRED: asset code AND home domain" });
    throw new Error("REQUIRED: asset code AND home domain");
  }

  let asset;

  try {
    const homeDomainIssuer = await getIssuerFromDomain({
      assetCode,
      homeDomain,
    });

    asset = `${assetCode}:${homeDomainIssuer}`;
  } catch (e) {
    log.error({ title: "Issuer domain error: ", body: getErrorMessage(e) });
    throw new Error(e);
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
    throw new Error(`Asset ${asset} is already trusted`);
  }

  return asset;
};
