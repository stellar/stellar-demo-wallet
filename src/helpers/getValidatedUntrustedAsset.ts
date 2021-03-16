import { Server, Asset } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { getCurrenciesFromDomain } from "helpers/getCurrenciesFromDomain";
import { getErrorMessage } from "helpers/getErrorMessage";
import { log } from "helpers/log";

interface GetUntrustedAssetProps {
  assetCode: string;
  homeDomain?: string;
  issuerPublicKey?: string;
  accountBalances?: Types.BalanceMap;
  networkUrl: string;
}

interface GetUntrustedAssetResponse {
  assetCode: string;
  assetIssuer: string;
  homeDomain?: string;
}

export const getValidatedUntrustedAsset = async ({
  assetCode,
  homeDomain,
  issuerPublicKey,
  accountBalances,
  networkUrl,
}: GetUntrustedAssetProps): Promise<GetUntrustedAssetResponse> => {
  log.instruction({
    title: `Start validating untrusted asset ${assetCode}`,
  });

  if (assetCode && !(homeDomain || issuerPublicKey)) {
    throw new Error(
      "Home domain OR issuer public key is required with asset code",
    );
  }

  const checkAsset = async (code: string, issuer: string) => {
    const asset = `${code}:${issuer}`;

    if (accountBalances?.[asset]) {
      throw new Error(`Asset ${asset} is already trusted`);
    }

    await checkAssetExists({
      assetCode: code,
      assetIssuer: issuer,
      networkUrl,
    });
  };

  // Asset code and issuer public key (no home domain provided)
  if (issuerPublicKey && !homeDomain) {
    await checkAsset(assetCode, issuerPublicKey);
    return {
      assetCode,
      assetIssuer: issuerPublicKey,
    };
  }

  // Asset code and home domain
  if (homeDomain) {
    try {
      const tomlCurrencies = await getCurrenciesFromDomain(homeDomain);
      const matchingAssets = tomlCurrencies.filter(
        (currency) => currency.code === assetCode,
      );

      const availableAssetsString = getAssetListString(tomlCurrencies, "code");
      const availableIssuersString = getAssetListString(
        matchingAssets,
        "issuer",
      );

      // No matching asset
      if (!matchingAssets.length) {
        throw new Error(
          `Unable to find the ${assetCode} asset on ${homeDomain} TOML file.
          Available assets: ${availableAssetsString}.`,
        );
      }

      // Home domain and issuer public key provided
      if (issuerPublicKey) {
        const matchingIssuer = matchingAssets.find(
          (m) => m.issuer === issuerPublicKey,
        );

        if (matchingIssuer) {
          await checkAsset(assetCode, issuerPublicKey);

          return {
            assetCode,
            assetIssuer: issuerPublicKey,
            homeDomain: await getOverrideHomeDomain({
              assetIssuer: issuerPublicKey,
              homeDomain,
              networkUrl,
            }),
          };
        }

        throw new Error(
          `Unable to find the ${assetCode} asset from issuer ${issuerPublicKey} on ${homeDomain} TOML file.
          Available issuers for ${assetCode}: ${availableIssuersString}.`,
        );
        // Home domain only (no issuer public key provided)
      } else {
        // Single match
        if (matchingAssets.length === 1) {
          const { issuer } = matchingAssets[0];
          await checkAsset(assetCode, issuer);
          return {
            assetCode,
            assetIssuer: issuer,
            homeDomain: await getOverrideHomeDomain({
              assetIssuer: issuer,
              homeDomain,
              networkUrl,
            }),
          };
        }

        // Multiple matches
        throw new Error(
          `Multiple issuers found for asset ${assetCode}, please provide issuer public key.
          Available issuers for ${assetCode}: ${availableIssuersString}.`,
        );
      }
    } catch (e) {
      throw new Error(getErrorMessage(e));
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

type CheckAssetExistsProps = {
  assetCode: string;
  assetIssuer: string;
  networkUrl: string;
};

const checkAssetExists = async ({
  assetCode,
  assetIssuer,
  networkUrl,
}: CheckAssetExistsProps) => {
  const server = new Server(networkUrl);
  const assetResponse = await server
    .assets()
    .forCode(assetCode)
    .forIssuer(assetIssuer)
    .call();

  if (!assetResponse.records.length) {
    throw new Error(`Asset ${assetCode}:${assetIssuer} does not exist.`);
  }
};

const getAssetListString = (assetsArray: Asset[], key: "code" | "issuer") =>
  assetsArray && assetsArray.length
    ? assetsArray.map((a) => a[key]).join(", ")
    : "";

type GetOverrideHomeDomainProps = {
  assetIssuer: string;
  homeDomain: string;
  networkUrl: string;
};

const getOverrideHomeDomain = async ({
  assetIssuer,
  homeDomain,
  networkUrl,
}: GetOverrideHomeDomainProps) => {
  const server = new Server(networkUrl);
  const accountRecord = await server.loadAccount(assetIssuer);
  const assetHomeDomain = accountRecord.home_domain;

  if (assetHomeDomain !== homeDomain) {
    log.instruction({
      title:
        "Asset home domain is different than the provided home domain. Provided home domain will override asset home domain.",
      body: `Asset home domain: ${assetHomeDomain || "not configured"}.
    Provided home domain: ${homeDomain}.`,
    });
    return homeDomain;
  }

  return undefined;
};
