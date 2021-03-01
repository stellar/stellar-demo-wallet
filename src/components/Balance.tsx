import { Select } from "@stellar/design-system";
import { Types } from "@stellar/wallet-sdk";
import { useDispatch } from "react-redux";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { fetchSendFieldsAction } from "ducks/sep31Send";
import { withdrawAssetAction } from "ducks/sep24WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import { AssetActionItem, AssetWithSupportedActions } from "types/types.d";

interface SortedBalancesResult {
  native: Types.NativeBalance[];
  other: AssetWithSupportedActions[];
}

export const Balance = ({
  onAssetAction,
  onSend,
}: {
  onAssetAction: ({
    balance,
    callback,
    title,
    description,
    options,
  }: AssetActionItem) => void;
  onSend: (asset?: Types.AssetBalance) => void;
}) => {
  const { account } = useRedux("account");
  const allBalances = account?.assets;

  const dispatch = useDispatch();

  enum assetActionId {
    SEND_PAYMENT = "send-payment",
    SEP24_DEPOSIT = "sep24-deposit",
    SEP24_WITHDRAW = "sep24-withdraw",
    SEP31_SEND = "sep31-send",
  }

  const groupBalances = () => {
    if (!allBalances) {
      return null;
    }

    const result: SortedBalancesResult = {
      native: [],
      other: [],
    };

    Object.values(allBalances).map((balance) => {
      if (balance.token.type === "native") {
        result.native = [...result.native, balance as Types.NativeBalance];
      } else {
        result.other = [...result.other, balance];
      }

      return result;
    });

    return result;
  };

  const handleSep24Deposit = (asset: Types.AssetBalance) => {
    dispatch(
      depositAssetAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
  };

  const handleSep24Withdraw = (asset: Types.AssetBalance) => {
    dispatch(
      withdrawAssetAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
  };

  const handleSep31Send = (asset: Types.AssetBalance) => {
    dispatch(
      fetchSendFieldsAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
  };

  const handleActionChange = ({
    actionId,
    balance,
  }: {
    actionId: string;
    balance: any;
  }) => {
    if (!actionId) {
      return;
    }

    let props: AssetActionItem | undefined;

    switch (actionId) {
      case assetActionId.SEND_PAYMENT:
        // TODO: title + description
        props = {
          balance,
          title: "Send payment",
          description: "Send payment description",
          callback: onSend,
        };
        break;
      case assetActionId.SEP24_DEPOSIT:
        // TODO: title + description
        props = {
          balance,
          title: "SEP-24 deposit",
          description: "SEP-24 deposit description",
          callback: () => handleSep24Deposit(balance),
        };
        break;
      case assetActionId.SEP24_WITHDRAW:
        // TODO: title + description
        props = {
          balance,
          title: "SEP-24 withdrawal",
          description: "SEP-24 withdrawal description",
          callback: () => handleSep24Withdraw(balance),
        };
        break;
      case assetActionId.SEP31_SEND:
        // TODO: title + description
        props = {
          balance,
          title: "SEP-31 send",
          description: "SEP-31 send description",
          callback: () => handleSep31Send(balance),
          // TODO: add options
        };
        break;
      default:
      // nothing
    }

    if (!props) {
      return;
    }

    onAssetAction(props);
  };

  const sortedBalances = groupBalances();

  if (!sortedBalances) {
    return null;
  }

  return (
    <>
      {/* Native (XLM) balance */}
      {sortedBalances.native.map((balance) => (
        <div className="BalanceRow" key={`${balance.token.code}:native`}>
          <div className="BalanceCell">{`${balance.total || "0"} ${
            balance.token.code
          }`}</div>
          <div className="BalanceCell">
            <Select
              id={`${balance.token.code}:native-actions`}
              onChange={(e) =>
                handleActionChange({ actionId: e.target.value, balance })
              }
            >
              <option value="">Select action</option>
              <option value={assetActionId.SEND_PAYMENT}>Send payment</option>
            </Select>
          </div>
        </div>
      ))}

      {/* Other balances */}
      {sortedBalances.other.map((balance) => (
        <div
          className="BalanceRow"
          key={`${balance.token.code}:${balance.token.issuer.key}`}
        >
          <div className="BalanceCell">
            <div>{`${balance.total || "0"} ${balance.token.code}`}</div>
            {balance.supportedActions.homeDomain && (
              <div>{balance.supportedActions.homeDomain}</div>
            )}
          </div>
          <div className="BalannceCell">
            <Select
              id={`${balance.token.code}:${balance.token.issuer.key}-actions`}
              onChange={(e) =>
                handleActionChange({ actionId: e.target.value, balance })
              }
            >
              <option value="">Select action</option>
              <option value={assetActionId.SEND_PAYMENT}>Send payment</option>
              {balance.supportedActions.sep24 && (
                <>
                  <option value={assetActionId.SEP24_DEPOSIT}>
                    SEP-24 Deposit
                  </option>
                  <option value={assetActionId.SEP24_WITHDRAW}>
                    SEP-24 Withdraw
                  </option>
                </>
              )}
              {balance.supportedActions.sep31 && (
                <option value={assetActionId.SEP31_SEND}>SEP-31 Send</option>
              )}
            </Select>
          </div>
        </div>
      ))}
    </>
  );
};
