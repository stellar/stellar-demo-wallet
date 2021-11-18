import { Types } from "@stellar/wallet-sdk";
import { checkAssetExists } from "./checkAssetExists";
import { getErrorMessage } from "./getErrorMessage";
import { getAssetFromHomeDomain } from "./getAssetFromHomeDomain";
import { log } from "./log";

interface GetUntrustedAssetProps {
  assetCode: string;
  homeDomain?: string;
  issuerPublicKey?: string;
  accountBalances?: Types.BalanceMap;
  networkUrl: string;
}

interface GetUntrustedAssetResponse {
  assetCode: string;
  assetIssuer: string;
  homeDomain?: string;
}

export const getValidatedUntrustedAsset = async ({
  assetCode,
  homeDomain,
  issuerPublicKey,
  accountBalances,
  networkUrl,
}: GetUntrustedAssetProps): Promise<GetUntrustedAssetResponse> => {
  log.instruction({
    title: `Validating untrusted asset ${assetCode}`,
  });

  if (assetCode && !(homeDomain || issuerPublicKey)) {
    throw new Error(
      "Home domain OR issuer public key is required with asset code",
    );
  }

  // Asset code and issuer public key (no home domain provided)
  if (issuerPublicKey && !homeDomain) {
    await checkAssetExists({
      assetCode,
      assetIssuer: issuerPublicKey,
      networkUrl,
      accountBalances,
    });
    return {
      assetCode,
      assetIssuer: issuerPublicKey,
    };
  }

  // Asset code and home domain
  if (homeDomain) {
    try {
      return await getAssetFromHomeDomain({
        assetCode,
        homeDomain,
        issuerPublicKey,
        networkUrl,
        accountBalances,
      });
    } catch (e) {
      throw new Error(getErrorMessage(e));
    }
  }

  const errorMessage = "No asset was found matching provided information";

  log.error({
    title: errorMessage,
    body: {
      assetCode,
      homeDomain,
      issuerPublicKey,
    },
  });
  throw new Error(errorMessage);
};
