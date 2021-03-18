import { ReactNode } from "react";
import { Select, TextLink } from "@stellar/design-system";
import { HomeDomainOverrideButtons } from "components/HomeDomainOverrideButtons";
import { shortenStellarKey } from "helpers/shortenStellarKey";
import {
  Asset,
  ActiveAssetAction,
  AssetActionId,
  AssetType,
  ClaimableAsset,
} from "types/types.d";

interface BalanceRowProps {
  activeAction: ActiveAssetAction | undefined;
  asset: Asset | ClaimableAsset;
  onAction?: (actionId: string, asset: Asset) => void;
  children?: ReactNode;
}

export const BalanceRow = ({
  activeAction,
  asset,
  onAction,
  children,
}: BalanceRowProps) => {
  const {
    assetString,
    assetCode,
    assetIssuer,
    total,
    supportedActions,
    isUntrusted,
    notExist,
    homeDomain,
  } = asset;
  const isActive = activeAction?.assetString === assetString;
  const disabled = Boolean(activeAction);

  return (
    <div
      className={`BalanceRow Inset ${isActive ? "active" : ""} ${
        disabled ? "disabled" : ""
      }`}
      key={assetString}
    >
      <div className="BalanceCell BalanceInfo">
        {notExist ? (
          <div className="BalanceAmount error">{`${assetCode}:${shortenStellarKey(
            assetIssuer,
          )} does not exist`}</div>
        ) : (
          <div className="BalanceAmount">{`${total || "0"} ${assetCode}`}</div>
        )}
        <div className="BalanceOptions Inline">
          {homeDomain && (
            <TextLink
              href={`//${homeDomain}/.well-known/stellar.toml`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {homeDomain}
            </TextLink>
          )}
          {asset.assetType !== AssetType.NATIVE && (
            <HomeDomainOverrideButtons asset={asset} />
          )}
        </div>
      </div>
      <div className="BalanceCell BalanceActions">
        {children && <div className="CustomCell">{children}</div>}

        {onAction && (
          <div className="BalanceCellSelect">
            <Select
              id={`${assetString}-actions`}
              onChange={(e) => onAction(e.target.value, asset)}
              disabled={disabled}
            >
              <option value="">Select action</option>
              {!isUntrusted && (
                <option value={AssetActionId.SEND_PAYMENT}>Send payment</option>
              )}
              {supportedActions?.sep24 && (
                <>
                  <option value={AssetActionId.SEP24_DEPOSIT}>
                    SEP-24 Deposit
                  </option>
                  {!isUntrusted && (
                    <option value={AssetActionId.SEP24_WITHDRAW}>
                      SEP-24 Withdraw
                    </option>
                  )}
                </>
              )}
              {!isUntrusted && supportedActions?.sep31 && (
                <option value={AssetActionId.SEP31_SEND}>SEP-31 Send</option>
              )}
            </Select>
          </div>
        )}
      </div>
    </div>
  );
};
