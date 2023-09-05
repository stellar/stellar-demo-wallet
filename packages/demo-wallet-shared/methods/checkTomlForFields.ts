import { log } from "../helpers/log";
import { getHomeDomainFromAssetIssuer } from "./getHomeDomainFromAssetIssuer";
import { getToml } from "./getToml";
import { TomlFields, AnyObject } from "../types/types";

export const checkTomlForFields = async ({
  sepName,
  assetIssuer,
  requiredKeys,
  networkUrl,
  homeDomain,
}: {
  sepName: string;
  assetIssuer: string;
  requiredKeys: TomlFields[];
  networkUrl: string;
  homeDomain?: string;
}) => {
  let homeDomainParam = homeDomain;

  if (!homeDomainParam) {
    homeDomainParam = await getHomeDomainFromAssetIssuer({
      assetIssuer,
      networkUrl,
    });
  }

  log.instruction({
    title: `Checking the \`stellar.toml\` to find the necessary information for the ${sepName} transaction`,
  });

  const tomlResponse: AnyObject = await getToml(homeDomainParam);
  const missingKeys: string[] = [];

  const result = requiredKeys.reduce((res: AnyObject, key) => {
    if (tomlResponse[key]) {
      log.instruction({
        title: `Received \`${key}\` from TOML`,
        body: tomlResponse[key],
      });

      return { ...res, [key]: tomlResponse[key].replace(/\/$/, "") };
    }

    missingKeys.push(`\`${key}\``);
    return res;
  }, {});

  if (missingKeys.length) {
    throw new Error(
      `TOML must contain a ${missingKeys.join(
        ", ",
      )} for ${sepName} transaction`,
    );
  }

  return result;
};
