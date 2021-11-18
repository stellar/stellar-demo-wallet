import { getCurrenciesFromDomain } from "./getCurrenciesFromDomain";

export const getIssuerFromDomain = async ({
  assetCode,
  homeDomain,
}: {
  assetCode: string;
  homeDomain: string;
}) => {
  const currencies = await getCurrenciesFromDomain(homeDomain);
  const matchingCurrency = currencies.find((c) => c.code === assetCode);

  if (!matchingCurrency?.issuer) {
    const availableAssets = currencies.map((c) => c.code).join(", ");

    throw new Error(
      `Unable to find the ${assetCode} issuer on the home domain’s TOML file.
      Available asset${currencies.length > 1 ? "s" : ""}: ${availableAssets}.`,
    );
  }

  return matchingCurrency.issuer;
};
