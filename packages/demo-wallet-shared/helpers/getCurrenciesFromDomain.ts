import { StellarToml } from "@stellar/stellar-sdk";
import { normalizeHomeDomainUrl } from "./normalizeHomeDomainUrl";

export const getCurrenciesFromDomain = async (
  homeDomain: string,
): Promise<StellarToml.Api.Currency[]> => {
  let domainURL;

  try {
    domainURL = normalizeHomeDomainUrl(homeDomain);
  } catch (e) {
    throw new Error("Anchor home domain is not a valid URL using HTTPS");
  }

  let toml;

  try {
    toml =
      domainURL.protocol === "http:"
        ? await StellarToml.Resolver.resolve(domainURL.host, {
            allowHttp: true,
          })
        : await StellarToml.Resolver.resolve(domainURL.host);
  } catch (e) {
    const reason = e instanceof Error && e.message ? `: ${e.message}` : "";
    throw new Error(
      `Unable to resolve \`stellar.toml\` for \`${homeDomain}\`${reason}`,
    );
  }

  if (!toml.CURRENCIES) {
    throw new Error(
      "The home domain specified does not have a `CURRENCIES` section on its TOML file",
    );
  }

  return toml.CURRENCIES;
};
