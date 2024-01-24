import { Types } from "@stellar/wallet-sdk";
import {
  Asset,
  AssetSupportedActions,
  AnyObject,
  AssetType,
  XLM_NATIVE_ASSET,
} from "../types/types";

interface NormalizeAssetProps {
  source?: Types.AssetBalance | Types.NativeBalance;
  homeDomain?: string;
  supportedActions?: AssetSupportedActions | AnyObject;
  isUntrusted?: boolean;
  isOverride?: boolean;
  assetCode?: string;
  assetIssuer?: string;
  assetType?: string;
}

export const normalizeAssetProps = ({
  source,
  homeDomain,
  supportedActions,
  isUntrusted = false,
  isOverride = false,
  assetCode = "",
  assetIssuer = "",
  assetType = "",
}: NormalizeAssetProps): Asset => {
  const _assetCode = assetCode || source?.token.code;
  const _assetType = assetType || source?.token.type;

  if (!(_assetCode && _assetType)) {
    throw new Error("Asset code and asset type are required");
  }

  let _assetIssuer = assetIssuer;

  if (!_assetIssuer && _assetType !== AssetType.NATIVE) {
    _assetIssuer = (source as Types.AssetBalance).token.issuer.key;
  }

  return {
    assetString:
      _assetType === AssetType.NATIVE
        ? XLM_NATIVE_ASSET
        : `${_assetCode}:${_assetIssuer}`,
    assetCode: _assetCode,
    assetIssuer: _assetIssuer,
    assetType: _assetType,
    total: source?.available?.toString() || "0",
    homeDomain,
    supportedActions,
    isUntrusted,
    isOverride,
    source,
  };
};
