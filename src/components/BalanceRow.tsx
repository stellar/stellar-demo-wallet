import React, { ReactNode, useEffect, useState } from "react";
import { Select } from "@stellar/design-system";
import { TextLink } from "components/TextLink";
import { HomeDomainOverrideButtons } from "components/HomeDomainOverrideButtons";
import { shortenStellarKey } from "helpers/shortenStellarKey";
import {
  Asset,
  ActiveAssetAction,
  AssetActionId,
  AssetType,
  ClaimableAsset,
} from "types/types.d";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";

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
          <>
            <div className="BalanceAmount">{`${
              total || "0"
            } ${assetCode}`}</div>
            <div className="BalanceOptions Inline">
              {homeDomain && (
                <TextLink
                  href={`//${homeDomain}/.well-known/stellar.toml`}
                  isExternal
                >
                  {homeDomain}
                </TextLink>
              )}
              {!asset.isClaimableBalance &&
                asset.assetType !== AssetType.NATIVE && (
                  <HomeDomainOverrideButtons asset={asset} />
                )}
            </div>
          </>
        )}
      </div>

      {supportedActions?.sep8 && (
        <div className="RegulatedInfo">
          <span>Regulated</span>
          <InfoButtonWithTooltip>
            {
              "Payments with regulated assets need to be approved by the asset issuer. For more information please refer to "
            }
            <TextLink
              href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md"
              isExternal
            >
              SEP-8
            </TextLink>
            {"."}
          </InfoButtonWithTooltip>
        </div>
      )}

      <div className="BalanceCell BalanceActions">
        {children && <div className="CustomCell">{children}</div>}

        {onAction && (
          <div className="BalanceCellSelect">
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

              {asset.supportedActions?.sep8 && (
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

            <InfoButtonWithTooltip>
              <>
                {
                  "What you can do with an asset (deposit, withdraw, or send) depends on what transactions the anchor supports."
                }{" "}
                <TextLink
                  href="https://developers.stellar.org/docs/anchoring-assets"
                  isExternal
                >
                  Learn more
                </TextLink>
              </>
            </InfoButtonWithTooltip>
          </div>
        )}
      </div>
    </div>
  );
};
