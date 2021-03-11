import { Server } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { getCurrenciesFromDomain } from "helpers/getCurrenciesFromDomain";
import { getErrorMessage } from "helpers/getErrorMessage";
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
      throw new Error(errorMessage);
    }
  };

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
        const errorMessage = getErrorMessage(e);
        log.error({
          title: errorMessage,
        });
        throw new Error(errorMessage);
      }
    } else {
      // Get available assets if no asset code was provided
      try {
        const tomlCurrencies = (await getCurrenciesFromDomain(homeDomain)).map(
          (currency: any) => currency.code,
        );

        let message = `No asset code was provided. The following assets are available on the home domain’s TOML file: ${tomlCurrencies.join(
          ", ",
        )}.`;

        if (tomlCurrencies.length === 1) {
          message = `No asset code was provided. ${tomlCurrencies[0]} asset is available on the home domain’s TOML file.`;
        }

        throw new Error(message);
      } catch (e) {
        const errorMessage = getErrorMessage(e);
        log.error({
          title: errorMessage,
        });
        throw new Error(errorMessage);
      }
    }
  }

  const errorMessage = "No asset was found matching provided information";

  log.error({
    title: errorMessage,
    body: {
      assetCode,
      homeDomain,
      issuerPublicKey,
    },
  });
  throw new Error(errorMessage);
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
