import { Asset, StellarTomlResolver } from "stellar-sdk";

export const getCurrenciesFromDomain = async (
  homeDomain: string,
): Promise<Asset[]> => {
  let domain = homeDomain;

  domain = domain.startsWith("http") ? domain : `https://${domain}`;
  domain = domain.replace(/\/$/, "");

  let domainURL;
  try {
    domainURL = new URL(domain);
  } catch (e) {
    throw new Error("Anchor home domain is not a valid URL using HTTPS");
  }

  const toml =
    domainURL.protocol === "http:"
      ? await StellarTomlResolver.resolve(domainURL.host, {
          allowHttp: true,
        })
      : await StellarTomlResolver.resolve(domainURL.host);

  if (!toml.CURRENCIES) {
    throw new Error(
      "The home domain specified does not have a CURRENCIES section on it's TOML file",
    );
  }

  return toml.CURRENCIES;
};
