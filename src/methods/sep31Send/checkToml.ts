import toml from "toml";
import { log } from "helpers/log";

export const checkToml = async ({
  homeDomain,
  pubnet,
}: {
  homeDomain: string;
  pubnet?: boolean;
}) => {
  if (!homeDomain) {
    throw new Error("Home domain is missing");
  }

  let homeDomainParam = homeDomain;

  log.instruction({
    title:
      "Check the stellar.toml to find the necessary information about the receivers payment server",
  });

  if (!homeDomainParam.includes("http")) {
    homeDomainParam = `https://${homeDomainParam}`;
  }

  homeDomainParam = homeDomainParam.replace(/\/$/, "");
  const tomlURL = `${homeDomainParam}/.well-known/stellar.toml`;

  log.request({ url: tomlURL });

  const result = await fetch(tomlURL);
  const resultText = await result.text();

  let authEndpoint;
  let sendServer;
  let kycServer;

  try {
    const information = toml.parse(resultText);
    log.response({ url: tomlURL, body: information });

    if (!information.WEB_AUTH_ENDPOINT) {
      throw new Error("Toml file doesn't contain a WEB_AUTH_ENDPOINT");
    }

    authEndpoint = information.WEB_AUTH_ENDPOINT;
    sendServer = information.DIRECT_PAYMENT_SERVER;
    kycServer = information.KYC_SERVER;
  } catch (error) {
    log.response({ url: tomlURL, body: resultText });
    throw new Error("stellar.toml is not a valid SEP31 TOML file");
  }

  log.instruction({
    title: `Received WEB_AUTH_ENDPOINT from TOML: ${authEndpoint}`,
  });
  log.instruction({
    title: `Received DIRECT_PAYMENT_SERVER from TOML: ${sendServer}`,
  });

  if (authEndpoint) {
    authEndpoint = authEndpoint.replace(/\/$/, "");
  }

  if (sendServer) {
    sendServer = sendServer.replace(/\/$/, "");
  }

  if (pubnet) {
    if (!(sendServer && sendServer.includes("https://"))) {
      throw new Error("DIRECT_PAYMENT_SERVER must be https");
    }

    if (!(authEndpoint && authEndpoint.includes("https://"))) {
      throw new Error("WEB_AUTH_ENDPOINT must be https");
    }
  }

  return {
    authEndpoint,
    sendServer,
    kycServer,
  };
};
