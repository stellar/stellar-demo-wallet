import { ReactNode } from "react";
import { Select, TextLink } from "@stellar/design-system";
import { Asset, AssetActionId } from "types/types.d";

interface BalanceRowProps {
  activeAssetId: string | undefined;
  asset: Asset;
  onChange: (e: any) => void;
  children?: ReactNode;
}

export const BalanceRow = ({
  activeAssetId,
  asset,
  onChange,
  children,
}: BalanceRowProps) => {
  const {
    assetString,
    assetCode,
    total,
    supportedActions,
    isUntrusted,
    homeDomain,
  } = asset;
  const isActive = activeAssetId === assetString;

  return (
    <div
      className={`BalanceRow Inset ${isActive ? "active" : ""}`}
      key={assetString}
    >
      <div className="BalanceCell BalanceInfo">
        <div className="BalanceAmount">{`${total || "0"} ${assetCode}`}</div>
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

        <div className="BalanceCellSelect">
          <Select id={`${assetString}-actions`} onChange={onChange}>
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
      </div>
    </div>
  );
};
