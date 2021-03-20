import StellarSdk from "stellar-sdk";
import { log } from "helpers/log";

export const getHomeDomainFromAssetIssuer = async ({
  assetIssuer,
  networkUrl,
}: {
  assetIssuer: string;
  networkUrl: string;
}) => {
  log.request({
    title: "Getting home domain from asset issuer",
    body: `Asset issuer ${assetIssuer}`,
  });

  const server = new StellarSdk.Server(networkUrl);
  const accountRecord = await server.loadAccount(assetIssuer);
  const homeDomain = accountRecord.home_domain;

  if (homeDomain) {
    log.response({
      title: "Received home domain from asset issuer",
      body: `Asset issuer ${assetIssuer}, home domain ${homeDomain}.`,
    });
  } else {
    log.error({
      title: `Asset issuer ${assetIssuer} does not have home domain configured`,
    });
  }

  return homeDomain;
};
