import { STELLAR_EXPERT_API } from "../config/constants";
import {
  Asset, AssetType,
  ContractAccountDetails,
} from "../types/types";
import { SmartWalletService } from "../services/SmartWalletService";
import {
  getAssetSettingsFromToml
} from "demo-wallet-shared/build/helpers/getAssetSettingsFromToml";
import {
  normalizeAssetProps
} from "demo-wallet-shared/build/helpers/normalizeAssetProps";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";
import {
  getNetworkConfig
} from "demo-wallet-shared/build/helpers/getNetworkConfig";

export const fetchContractAccountInfo = async (
  contractId: string,
): Promise<ContractAccountDetails> => {
  try {
    const response = await fetch(
      `${STELLAR_EXPERT_API}/contract/${contractId}`,
    );
    const responseJson = await response.json();
    if (responseJson.error) {
      throw responseJson.error;
    }
    return responseJson;
  } catch (error) {
    console.error("Error fetching contract account details:", error);
    throw error;
  }
};

export const fetchContractAssets = async (
  contractId: string,
  userAssets: Array<{
    code: string;
    issuer: string;
    homeDomain?: string;
  }>,
): Promise<Asset[]> => {
  const assetsPromises= userAssets.map((userAsset) => fetchContractAsset(contractId, userAsset))
  return Promise.all(assetsPromises);
}

export const fetchContractAsset = async (
  contractId: string,
  userAsset: {
    code: string;
    issuer: string;
    homeDomain?: string;
  },
): Promise<Asset> => {
  const swService = SmartWalletService.getInstance();
  const networkUrl = getNetworkConfig().url;

  const { type, balance } = await swService.fetchBalance(
    contractId,
    userAsset.code,
    userAsset.issuer
  );

  const assetString = `${userAsset.code}:${userAsset.issuer}`;
  const assetId = isNativeAsset(userAsset.code) ? AssetType.NATIVE : assetString;
  const { homeDomain, supportedActions } =  await getAssetSettingsFromToml({
      assetId,
      networkUrl,
      homeDomainOverride: userAsset.homeDomain,
    });

  const asset = normalizeAssetProps({
    assetCode: userAsset.code,
    assetIssuer: userAsset.issuer,
    assetType: type,
    homeDomain: homeDomain,
    supportedActions: supportedActions,
    isUntrusted: false,
    isOverride: Boolean(userAsset.homeDomain),
  });
  asset.total = balance;

  return asset;
}