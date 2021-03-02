import { ReactNode } from "react";
import { Select } from "@stellar/design-system";
import { AssetActionId, AssetSupportedActions } from "types/types.d";

interface BalanceRowProps {
  asset: {
    id: string;
    code: string;
    amount: string;
    supportedActions?: AssetSupportedActions;
    isUntrusted?: boolean;
  };
  onChange: (e: any) => void;
  children?: ReactNode;
}

export const BalanceRow = ({ asset, onChange, children }: BalanceRowProps) => {
  const { id, code, amount, supportedActions, isUntrusted } = asset;

  return (
    <div className="BalanceRow" key={`${code}:${id}`}>
      <div className="BalanceCell">
        <div>{`${amount || "0"} ${code}`}</div>
        {supportedActions?.homeDomain && (
          <div>{supportedActions.homeDomain}</div>
        )}
      </div>
      {children && <div className="BalanceCell">{children}</div>}
      <div className="BalanceCell">
        <Select id={`${code}:${id}-actions`} onChange={onChange}>
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
  );
};
