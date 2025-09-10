import {
  Asset, AssetType,
  ContractAccountDetails,
} from "../types/types";
import { SmartWalletService } from "demo-wallet-shared/build/services/SmartWalletService";
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
import { Server } from "@stellar/stellar-sdk/rpc";
import { Contract, xdr } from "@stellar/stellar-sdk";

export const fetchContractAccountInfo = async (
  contractId: string,
): Promise<ContractAccountDetails> => {
  try {
    const server = new Server(getNetworkConfig().rpcUrl);
    const contractInstanceKey = xdr.LedgerKey.contractData(
      new xdr.LedgerKeyContractData({
        contract: new Contract(contractId).address().toScAddress(),
        key: xdr.ScVal.scvLedgerKeyContractInstance(),
        durability: xdr.ContractDataDurability.persistent(),
      })
    );
    const ledgerResponse = await server.getLedgerEntries(contractInstanceKey);
    const resp= {
      contract: contractId,
      ledgerEntries: ledgerResponse.entries,
    }
    return resp;
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
  const swService = await SmartWalletService.getInstance();
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
    supportedActions: { ...supportedActions, sep31: false },
    isUntrusted: false,
    isOverride: Boolean(userAsset.homeDomain),
  });
  asset.total = balance;

  return asset;
}