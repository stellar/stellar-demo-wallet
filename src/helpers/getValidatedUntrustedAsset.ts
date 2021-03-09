import { Server } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { getIssuerFromDomain } from "helpers/getIssuerFromDomain";
import { log } from "helpers/log";

interface GetUntrustedAssetProps {
  assetCode?: string;
  homeDomain?: string;
  issuerPublicKey?: string;
  accountBalances?: Types.BalanceMap;
  networkUrl: string;
}

export const getValidatedUntrustedAsset = async ({
  assetCode,
  homeDomain,
  issuerPublicKey,
  accountBalances,
  networkUrl,
}: GetUntrustedAssetProps) => {
  log.instruction({
    title: `Start validating untrusted asset ${assetCode}`,
  });

  const isAssetAlreadyTrusted = (code: string, issuer: string) => {
    const asset = `${code}:${issuer}`;

    if (accountBalances?.[asset]) {
      const errorMessage = `Asset ${asset} is already trusted.`;
      log.instruction({ title: errorMessage });
      throw Error(errorMessage);
    }
  };

  // TODO: if only home domain provided, fetch all assets from toml if exists

  if (assetCode && !(homeDomain || issuerPublicKey)) {
    const errorMessage =
      "Home domain or issuer public key is required with asset code";
    log.error({ title: errorMessage });
    throw new Error(errorMessage);
  }

  // Valid asset from issuer public key
  if (
    assetCode &&
    issuerPublicKey &&
    (await assetExists({ assetCode, assetIssuer: issuerPublicKey, networkUrl }))
  ) {
    isAssetAlreadyTrusted(assetCode, issuerPublicKey);
    return `${assetCode}:${issuerPublicKey}`;
  }

  if (homeDomain) {
    // Valid asset from home domain
    if (assetCode) {
      try {
        const homeDomainIssuer = await getIssuerFromDomain({
          assetCode,
          homeDomain,
        });

        if (
          await assetExists({
            assetCode,
            assetIssuer: homeDomainIssuer,
            networkUrl,
          })
        ) {
          isAssetAlreadyTrusted(assetCode, homeDomainIssuer);
          return `${assetCode}:${homeDomainIssuer}`;
        }
      } catch (e) {
        // TODO: better message
        log.error({ title: "Issuer domain error: ", body: e.toString() });
        throw new Error(e);
      }
    }
  }

  throw Error("No asset was found matching information provided");
};

const assetExists = async ({
  assetCode,
  assetIssuer,
  networkUrl,
}: {
  assetCode: string;
  assetIssuer: string;
  networkUrl: string;
}) => {
  const server = new Server(networkUrl);
  const assetResponse = await server
    .assets()
    .forCode(assetCode)
    .forIssuer(assetIssuer)
    .call();

  return Boolean(assetResponse.records.length);
};
