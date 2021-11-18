import { Asset, StellarTomlResolver } from "stellar-sdk";
import { normalizeHomeDomainUrl } from "./normalizeHomeDomainUrl";

export const getCurrenciesFromDomain = async (
  homeDomain: string,
): Promise<Asset[]> => {
  let domainURL;

  try {
    domainURL = normalizeHomeDomainUrl(homeDomain);
  } catch (e) {
    throw new Error("Anchor home domain is not a valid URL using HTTPS");
  }

  try {
    const toml =
      domainURL.protocol === "http:"
        ? await StellarTomlResolver.resolve(domainURL.host, {
            allowHttp: true,
          })
        : await StellarTomlResolver.resolve(domainURL.host);

    if (!toml.CURRENCIES) {
      throw new Error(
        "The home domain specified does not have a `CURRENCIES` section on its TOML file",
      );
    }

    return toml.CURRENCIES;
  } catch (e) {
    throw new Error(
      `\`${homeDomain}\` is not a valid home domain, TOML file was not found`,
    );
  }
};
