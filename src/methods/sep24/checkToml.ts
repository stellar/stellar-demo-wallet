import StellarSdk, { StellarTomlResolver } from "stellar-sdk";
import { log } from "helpers/log";

export const checkToml = async ({
  assetIssuer,
  networkUrl,
  homeDomain,
}: {
  assetIssuer: string;
  networkUrl: string;
  homeDomain?: string;
}) => {
  // TODO: save domain name with untrusted asset, if it was provided
  // if (this.assets.get(`${asset_code}:${asset_issuer}`)) {
  //   homeDomain = this.assets.get(`${asset_code}:${asset_issuer}`).homeDomain
  // }

  let homeDomainParam = homeDomain;

  const server = new StellarSdk.Server(networkUrl);

  if (!homeDomainParam) {
    log.request({
      title: "Fetching issuer account from Horizon",
      body: assetIssuer,
    });

    const accountRecord = await server.accounts().accountId(assetIssuer).call();

    log.response({
      title: "Fetching issuer account from Horizon",
      body: accountRecord,
    });

    homeDomainParam = accountRecord.home_domain;
  }

  if (!homeDomainParam) {
    // TODO: handle no domain case
    console.log("Need to provide home domain");
    throw new Error("Need to provide home domain");
    // let inputs
    // try {
    //   inputs = await this.setPrompt({
    //     message: "Enter the anchor's home domain",
    //     inputs: [new PromptInput('anchor home domain (ex. example.com)')],
    //   })
    // } catch (e) {
    //   finish()
    //   return
    // }
    // homeDomain = inputs[0].value
  }

  log.instruction({
    title:
      "Check the stellar.toml to find the necessary information about the payment server",
  });

  if (!homeDomainParam.startsWith("http")) {
    homeDomainParam = `https://${homeDomainParam}`;
  }

  homeDomainParam = homeDomainParam.replace(/\/$/, "");
  const tomlURL = new URL(homeDomainParam);
  tomlURL.pathname = "/.well-known/stellar.toml";

  log.request({ title: tomlURL.toString() });

  const result =
    tomlURL.protocol === "http:"
      ? await StellarTomlResolver.resolve(tomlURL.host, { allowHttp: true })
      : await StellarTomlResolver.resolve(tomlURL.host);

  log.instruction({
    title: `Received WEB_AUTH_ENDPOINT from TOML: ${result.WEB_AUTH_ENDPOINT}`,
  });
  log.instruction({
    title: `Received TRANSFER_SERVER_SEP0024 from TOML: ${result.TRANSFER_SERVER_SEP0024}`,
  });
  log.instruction({
    title: `Received asset issuer from TOML: ${result.SIGNING_KEY}`,
  });

  if (
    !result.SIGNING_KEY ||
    !result.TRANSFER_SERVER_SEP0024 ||
    !result.WEB_AUTH_ENDPOINT
  ) {
    throw new Error(
      "TOML must contain a SIGNING_KEY, TRANSFER_SERVER_SEP0024 and WEB_AUTH_ENDPOINT",
    );
  }

  return result;
};
