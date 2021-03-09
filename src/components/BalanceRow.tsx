import { ReactNode } from "react";
import { Select, TextLink } from "@stellar/design-system";
import { shortenStellarKey } from "helpers/shortenStellarKey";
import {
  Asset,
  ActiveAsset,
  AssetActionId,
  ClaimableAsset,
} from "types/types.d";

interface BalanceRowProps {
  activeAsset: ActiveAsset | undefined;
  asset: Asset | ClaimableAsset;
  onChange?: (e: any) => void;
  children?: ReactNode;
}

export const BalanceRow = ({
  activeAsset,
  asset,
  onChange,
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
  const isActive = activeAsset?.id === assetString;
  const disabled = Boolean(activeAsset);

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
        {homeDomain && (
          <div className="BalanceHomeDomain">
            <TextLink
              href={`//${homeDomain}/.well-known/stellar.toml`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {homeDomain}
            </TextLink>
          </div>
        )}
      </div>
      <div className="BalanceCell BalanceActions">
        {children && <div className="CustomCell">{children}</div>}

        {onChange && (
          <div className="BalanceCellSelect">
            <Select
              id={`${assetString}-actions`}
              onChange={onChange}
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
