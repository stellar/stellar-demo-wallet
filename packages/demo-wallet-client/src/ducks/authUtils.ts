import {
  getNetworkConfig,
} from "demo-wallet-shared/build/helpers/getNetworkConfig";
import {
  normalizeHomeDomainUrl,
} from "demo-wallet-shared/build/helpers/normalizeHomeDomainUrl";
import {
  checkTomlForFields,
} from "demo-wallet-shared/build/methods/checkTomlForFields";
import { TomlFields } from "demo-wallet-shared/build/types/types";
import {
  sep10AuthSend,
  sep10AuthSign,
  sep10AuthStart,
} from "demo-wallet-shared/build/methods/sep10Auth";
import {
  sep45AuthSend,
  sep45AuthSign,
  sep45AuthStart,
} from "demo-wallet-shared/build/methods/sep45Auth";
import { checkInfo } from "demo-wallet-shared/build/methods/sep24";
import { AnchorActionType } from "../types/types";
import { log } from "demo-wallet-shared/build/helpers/log";
import { custodialSelector } from "./custodial";

export interface Sep10AuthParams {
  publicKey: string;
  secretKey: string;
  homeDomain: string;
  clientDomain: string;
  walletBackendEndpoint: string;
  custodialMode?: {
    isEnabled: boolean;
    publicKey: string;
    secretKey: string;
    memoId: string;
  };
}

export interface Sep45AuthParams {
  contractId: string;
  homeDomain: string;
  clientDomain: string;
  authEndpoint?: string; // Optional override, defaults to sep45 server
}

/**
 * Reusable SEP-10 authentication utility
 * Returns JWT token for authenticated requests
 */
export const authenticateWithSep10 = async (
  anchorActionType: AnchorActionType,
  assetCode: string,
  assetIssuer: string,
  clientDomain: string,
  homeDomain: string,
  publicKey: string,
  requiredKeys: TomlFields[],
  secretKey: string,
  sepName: string,
  state: any,
  walletBackendEndpoint: string,
): Promise<string> => {
  log.instruction({
    title: `Initiating a ${sepName} for classic account`,
  });

  const networkConfig = getNetworkConfig();
  const {
    isEnabled: custodialIsEnabled,
    secretKey: custodialSecretKey,
    publicKey: custodialPublicKey,
    memoId: custodialMemoId,
  } = custodialSelector(state);
  // This is unlikely
  if (
    custodialIsEnabled &&
    !(custodialSecretKey && custodialPublicKey && custodialMemoId)
  ) {
    throw new Error(
      "Custodial mode requires secret key, public key, and memo ID",
    );
  }

  // Check TOML for required SEP-10 fields
  const tomlResponse = await checkTomlForFields({
    sepName,
    assetIssuer,
    requiredKeys,
    networkUrl: networkConfig.url,
    homeDomain,
  });

  await checkInfo({
    type: anchorActionType,
    toml: tomlResponse,
    assetCode,
  });

  log.instruction({
    title: `${sepName} is enabled, and requires authentication so we should go through SEP-10`,
  });

  // SEP-10 start
  const challengeTransaction = await sep10AuthStart({
    authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
    serverSigningKey: tomlResponse.SIGNING_KEY,
    publicKey: custodialPublicKey || publicKey,
    homeDomain: normalizeHomeDomainUrl(homeDomain).host,
    clientDomain,
    memoId: custodialMemoId,
  });

  // SEP-10 sign
  const signedChallengeTransaction = await sep10AuthSign({
    secretKey: custodialSecretKey || secretKey,
    networkPassphrase: networkConfig.network,
    challengeTransaction,
    walletBackendEndpoint,
  });

  // SEP-10 send
  return await sep10AuthSend({
    authEndpoint: tomlResponse.WEB_AUTH_ENDPOINT,
    signedChallengeTransaction,
  });
};

/**
 * Reusable SEP-45 authentication utility
 * Returns JWT token for authenticated requests
 */
export const authenticateWithSep45 = async (
  anchorActionType: AnchorActionType,
  assetCode: string,
  assetIssuer: string,
  clientDomain: string,
  contractId: string,
  homeDomain: string,
  requiredKeys: TomlFields[],
  sepName: string,
): Promise<string> => {
  log.instruction({
    title: `Initiating a ${sepName} for classic account`,
  });

  const networkConfig = getNetworkConfig();

  // Check TOML for required SEP-10 fields
  const tomlResponse = await checkTomlForFields({
    sepName,
    assetIssuer: assetIssuer,
    requiredKeys,
    networkUrl: networkConfig.url,
    homeDomain,
  });

  await checkInfo({
    type: anchorActionType,
    toml: tomlResponse,
    assetCode,
  });

  log.instruction({
    title: `${sepName} is enabled, and requires authentication so we should go through SEP-45`,
  });

  // SEP-45 start
  const challengeTransaction = await sep45AuthStart({
    authEndpoint: tomlResponse.WEB_AUTH_FOR_CONTRACTS_ENDPOINT || "https://anchor-sep-server-dev.stellar.org/sep45/auth",
    contractAddress: contractId,
    homeDomain: normalizeHomeDomainUrl(homeDomain).host,
    clientDomain,
  });

  // SEP-45 sign
  const signedChallengeResponse = await sep45AuthSign({
    authEntries: challengeTransaction.authorizationEntries,
  });

  // SEP-45 send
  return await sep45AuthSend({
    authEndpoint: tomlResponse.WEB_AUTH_FOR_CONTRACTS_ENDPOINT || "https://anchor-sep-server-dev.stellar.org/sep45/auth",
    signedChallengeResponse,
  });
};