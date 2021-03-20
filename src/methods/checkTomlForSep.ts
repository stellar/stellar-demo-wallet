import { log } from "helpers/log";
import { getHomeDomainFromAssetIssuer } from "methods/getHomeDomainFromAssetIssuer";
import { getToml } from "methods/getToml";
import { TomlFields, AnyObject } from "types/types.d";

export const checkTomlForSep = async ({
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

  if (!homeDomainParam) {
    throw new Error("Home domain was not found and is required");
  }

  log.instruction({
    title: `Checking the stellar.toml to find the necessary information for the ${sepName} transaction`,
  });

  const tomlResponse = await getToml(homeDomainParam);
  const missingKeys: TomlFields[] = [];

  const result = requiredKeys.reduce((res: AnyObject, key) => {
    if (tomlResponse[key]) {
      log.instruction({
        title: `Received ${key} from TOML`,
        body: tomlResponse[key],
      });

      return { ...res, [key]: tomlResponse[key].replace(/\/$/, "") };
    }

    missingKeys.push(key);
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
