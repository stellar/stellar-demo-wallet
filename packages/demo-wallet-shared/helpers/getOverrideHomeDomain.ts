import { Horizon } from "stellar-sdk";
import { log } from "./log";

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
  const server = new Horizon.Server(networkUrl);
  const accountRecord = await server.loadAccount(assetIssuer);
  const assetHomeDomain = accountRecord.home_domain;

  if (assetHomeDomain !== homeDomain) {
    log.instruction({
      title: `Entered home domain \`${homeDomain}\` will override asset’s home domain \`${
        assetHomeDomain || "not configured"
      }\``,
    });
    return homeDomain;
  }

  return undefined;
};
