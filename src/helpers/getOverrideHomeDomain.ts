import { Server } from "stellar-sdk";
import { log } from "helpers/log";

type GetOverrideHomeDomainProps = {
  assetIssuer: string;
  homeDomain: string;
  networkUrl: string;
};

export const getOverrideHomeDomain = async ({
  assetIssuer,
  homeDomain,
  networkUrl,
}: GetOverrideHomeDomainProps) => {
  const server = new Server(networkUrl);
  const accountRecord = await server.loadAccount(assetIssuer);
  const assetHomeDomain = accountRecord.home_domain;

  if (assetHomeDomain !== homeDomain) {
    log.instruction({
      title:
        "Asset home domain is different than the provided home domain. Provided home domain will override asset home domain.",
      body: `Asset home domain: ${assetHomeDomain || "not configured"}.
    Provided home domain: ${homeDomain}.`,
    });
    return homeDomain;
  }

  return undefined;
};
