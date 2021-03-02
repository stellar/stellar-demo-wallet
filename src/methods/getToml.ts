import { StellarTomlResolver } from "stellar-sdk";

export const getToml = async (homeDomain: string) => {
  let homeDomainParam = homeDomain;

  if (!homeDomainParam.startsWith("http")) {
    homeDomainParam = `https://${homeDomainParam}`;
  }

  homeDomainParam = homeDomainParam.replace(/\/$/, "");

  const tomlURL = new URL(homeDomainParam);
  tomlURL.pathname = "/.well-known/stellar.toml";

  const tomlResponse =
    tomlURL.protocol === "http:"
      ? await StellarTomlResolver.resolve(tomlURL.host, {
          allowHttp: true,
        })
      : await StellarTomlResolver.resolve(tomlURL.host);

  return tomlResponse;
};
