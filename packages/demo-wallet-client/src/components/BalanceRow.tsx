import React, { ReactNode, useEffect, useState } from "react";
import { Select, TextLink, DetailsTooltip } from "@stellar/design-system";
import { HomeDomainOverrideButtons } from "components/HomeDomainOverrideButtons";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";
import {
  Asset,
  ActiveAssetAction,
  AssetActionId,
  ClaimableAsset,
} from "types/types";

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
  const [selectValue, setSelectValue] = useState("");

  useEffect(() => {
    // reset value to default after modal close
    if (!isActive) {
      setSelectValue("");
    }
  }, [isActive]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectValue(value);
    if (onAction) {
      onAction(value, asset);
    }
  };

  const renderActionsSelect = () => {
    if (onAction) {
      // Regulated asset needs to be trusted first
      if (isUntrusted && asset.supportedActions?.sep8) {
        return null;
      }

      return (
        <div className="BalanceCellSelect">
          <DetailsTooltip
            details={
              <>
                {
                  "What you can do with an asset (deposit, withdraw, or send) depends on what transactions the anchor supports."
                }{" "}
                <TextLink href="https://developers.stellar.org/docs/anchoring-assets">
                  Learn more
                </TextLink>
              </>
            }
          >
            <Select
              id={`${assetString}-actions`}
              onChange={handleSelectChange}
              disabled={disabled}
              value={selectValue}
            >
              <option value="">Select action</option>
              {!isUntrusted && !asset.supportedActions?.sep8 && (
                <option value={AssetActionId.SEND_PAYMENT}>Send payment</option>
              )}

              {supportedActions?.sep6 && (
                <>
                  <option value={AssetActionId.SEP6_DEPOSIT}>
                    SEP-6 Deposit
                  </option>
                  {!isUntrusted && (
                    <option value={AssetActionId.SEP6_WITHDRAW}>
                      SEP-6 Withdraw
                    </option>
                  )}
                </>
              )}

              {!isUntrusted && asset.supportedActions?.sep8 && (
                <option value={AssetActionId.SEP8_SEND_PAYMENT}>
                  SEP-8 Send
                </option>
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
          </DetailsTooltip>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`BalanceRow Layout__inset ${isActive ? "active" : ""} ${
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
          <>
            <div className="BalanceAmount">{`${
              total || "0"
            } ${assetCode}`}</div>
            <div className="BalanceOptions Layout__inline">
              {homeDomain && (
                <TextLink
                  href={`//${homeDomain}/.well-known/stellar.toml`}
                  variant={TextLink.variant.secondary}
                  underline
                >
                  {homeDomain}
                </TextLink>
              )}
              {!asset.isClaimableBalance && (
                <HomeDomainOverrideButtons asset={asset} />
              )}
            </div>
          </>
        )}
      </div>

      {supportedActions?.sep8 && (
        <div className="BalanceCell RegulatedAsset">
          <DetailsTooltip
            details={
              <>
                {
                  "Payments with regulated assets need to be approved by the asset issuer. For more information please refer to "
                }
                <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md">
                  SEP-8
                </TextLink>
                .
              </>
            }
          >
            <span>Regulated</span>
          </DetailsTooltip>
        </div>
      )}

      <div className="BalanceCell BalanceActions">
        {children && <div className="CustomCell">{children}</div>}

        {renderActionsSelect()}
      </div>
    </div>
  );
};
