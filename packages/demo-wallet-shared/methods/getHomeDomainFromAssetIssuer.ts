import { Horizon } from "stellar-sdk";
import { log } from "../helpers/log";

export const getHomeDomainFromAssetIssuer = async ({
  assetIssuer,
  networkUrl,
}: {
  assetIssuer: string;
  networkUrl: string;
}): Promise<string> => {
  log.request({
    title: "Getting home domain from asset issuer",
    body: `Asset issuer ${assetIssuer}`,
  });

  const server = new Horizon.Server(networkUrl);
  const accountRecord = await server.loadAccount(assetIssuer);
  const homeDomain: string | undefined = accountRecord.home_domain;

  if (!homeDomain) {
    throw new Error(
      `Asset issuer ${assetIssuer} does not have home domain configured`,
    );
  }

  log.response({
    title: "Received home domain from asset issuer",
    body: `Asset issuer ${assetIssuer}, home domain ${homeDomain}.`,
  });

  return homeDomain;
};
