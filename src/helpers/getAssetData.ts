import { Server, StellarTomlResolver } from "stellar-sdk";
import { Types } from "@stellar/wallet-sdk";

// TODO: add logs
export const getAssetData = async ({
  balances,
  networkUrl,
}: {
  balances: Types.BalanceMap;
  networkUrl: string;
}) => {
  const allAssets = Object.entries(balances);
  // TODO: any type
  const assets: any = {};

  if (!allAssets?.length) {
    return assets;
  }

  const server = new Server(networkUrl);

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < allAssets.length; i++) {
    const [assetId, data] = allAssets[i];

    // Native (XLM) asset
    if (assetId === "native") {
      assets[assetId] = {
        ...data,
      };
    } else {
      // Other assets
      // TODO: any type
      let supportedActions: any = {};
      const [, assetIssuer] = assetId.split(":");
      // eslint-disable-next-line no-await-in-loop
      const accountRecord = await server.loadAccount(assetIssuer);
      const homeDomain = accountRecord.home_domain;

      if (homeDomain) {
        // eslint-disable-next-line no-await-in-loop
        const toml = await getToml(homeDomain);

        supportedActions = {
          homeDomain,
          sep6: Boolean(toml.TRANSFER_SERVER),
          sep24: Boolean(toml.TRANSFER_SERVER_SEP0024),
          sep31: Boolean(toml.DIRECT_PAYMENT_SERVER),
        };
      }

      assets[assetId] = {
        ...data,
        ...{ supportedActions },
      };
    }
  }

  return assets;
};

const getToml = async (homeDomain: string) => {
  let homeDomainParam = homeDomain;

  if (!homeDomainParam.startsWith("http")) {
    homeDomainParam = `https://${homeDomainParam}`;
  }

  homeDomainParam = homeDomainParam.replace(/\/$/, "");

  const tomlURL = new URL(homeDomainParam);
  tomlURL.pathname = "/.well-known/stellar.toml";

  const tomlResponse =
    tomlURL.protocol === "http:"
      ? // eslint-disable-next-line no-await-in-loop
        await StellarTomlResolver.resolve(tomlURL.host, {
          allowHttp: true,
        })
      : // eslint-disable-next-line no-await-in-loop
        await StellarTomlResolver.resolve(tomlURL.host);

  return tomlResponse;
};
