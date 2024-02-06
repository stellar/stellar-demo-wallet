import { Asset, StellarToml } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";
import { checkAssetExists } from "./checkAssetExists";
import { getCurrenciesFromDomain } from "./getCurrenciesFromDomain";
import { getOverrideHomeDomain } from "./getOverrideHomeDomain";
import { isNativeAsset } from "./isNativeAsset";

const getAssetListString = (
  assetsArray: Asset[] | StellarToml.Api.Currency[],
  key: "code" | "issuer",
) =>
  assetsArray && assetsArray.length
    ? assetsArray.map((a) => a[key]).join(", ")
    : "";

type GetAssetFromHomeDomainProps = {
  assetCode: string;
  homeDomain: string;
  issuerPublicKey?: string;
  accountBalances?: Types.BalanceMap;
  networkUrl: string;
};

export const getAssetFromHomeDomain = async ({
  assetCode,
  homeDomain,
  issuerPublicKey,
  networkUrl,
  accountBalances,
}: GetAssetFromHomeDomainProps) => {
  const tomlCurrencies = await getCurrenciesFromDomain(homeDomain);
  const isNative = isNativeAsset(assetCode);
  const _assetCode = isNative ? "native" : assetCode;

  const matchingAssets = tomlCurrencies.filter(
    (currency) => currency.code === _assetCode,
  );

  const availableAssetsString = getAssetListString(tomlCurrencies, "code");
  const availableIssuersString = getAssetListString(matchingAssets, "issuer");

  // No matching asset
  if (!matchingAssets.length) {
    throw new Error(
      `Unable to find the ${
        isNative ? `${assetCode} (native)` : assetCode
      } asset on \`${homeDomain}\` TOML file.
      Available assets: ${availableAssetsString}.`,
    );
  }

  // Home domain and issuer public key provided
  if (issuerPublicKey) {
    const matchingIssuer = matchingAssets.find(
      (m) => m.issuer === issuerPublicKey,
    );

    if (matchingIssuer) {
      await checkAssetExists({
        assetCode,
        assetIssuer: issuerPublicKey,
        networkUrl,
        accountBalances,
      });

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
      `Unable to find the ${assetCode} asset from issuer \`${issuerPublicKey}\` on \`${homeDomain}\` TOML file.
      Available issuers for ${assetCode}: ${availableIssuersString}.`,
    );
    // Home domain only (no issuer public key provided)
  } else {
    // Single match
    if (matchingAssets.length === 1) {
      const { issuer } = matchingAssets[0];

      // No need to check that XLM (native) asset exists
      if (!isNative) {
        await checkAssetExists({
          assetCode,
          assetIssuer: issuer!,
          networkUrl,
          accountBalances,
        });
      }

      return {
        assetCode,
        assetIssuer: issuer!,
        homeDomain: isNative
          ? undefined
          : await getOverrideHomeDomain({
              assetIssuer: issuer!,
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
};
