import { StellarTomlResolver } from "stellar-sdk";
import { normalizeHomeDomainUrl } from "helpers/normalizeHomeDomainUrl";

export const getToml = async (homeDomain: string) => {
  const tomlURL = normalizeHomeDomainUrl(homeDomain);
  tomlURL.pathname = "/.well-known/stellar.toml";

  const tomlResponse =
    tomlURL.protocol === "http:"
      ? await StellarTomlResolver.resolve(tomlURL.host, {
          allowHttp: true,
        })
      : await StellarTomlResolver.resolve(tomlURL.host);

  return tomlResponse;
};
