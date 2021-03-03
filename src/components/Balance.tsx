import { useDispatch } from "react-redux";
import { BalanceRow } from "components/BalanceRow";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { fetchSendFieldsAction } from "ducks/sep31Send";
import { withdrawAssetAction } from "ducks/sep24WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import { Asset, AssetActionItem, AssetActionId } from "types/types.d";

interface SortedBalancesResult {
  native: Asset[];
  other: Asset[];
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
  onSend: (asset?: Asset) => void;
}) => {
  const { account, activeAsset } = useRedux("account", "activeAsset");
  const allBalances = account?.assets;

  const dispatch = useDispatch();

  const groupBalances = () => {
    if (!allBalances) {
      return null;
    }

    const result: SortedBalancesResult = {
      native: [],
      other: [],
    };

    Object.values(allBalances).map((balance) => {
      if (balance.assetType === "native") {
        result.native = [...result.native, balance];
      } else {
        result.other = [...result.other, balance];
      }

      return result;
    });

    return result;
  };

  const handleSep24Deposit = (asset: Asset) => {
    dispatch(
      depositAssetAction({
        assetCode: asset.assetCode,
        assetIssuer: asset.assetIssuer,
      }),
    );
  };

  const handleSep24Withdraw = (asset: Asset) => {
    dispatch(
      withdrawAssetAction({
        assetCode: asset.assetCode,
        assetIssuer: asset.assetIssuer,
      }),
    );
  };

  const handleSep31Send = (asset: Asset) => {
    dispatch(
      fetchSendFieldsAction({
        assetCode: asset.assetCode,
        assetIssuer: asset.assetIssuer,
      }),
    );
  };

  const handleActionChange = ({
    actionId,
    balance,
  }: {
    actionId: string;
    balance: Asset;
  }) => {
    if (!actionId) {
      return;
    }

    let props: AssetActionItem | undefined;

    switch (actionId) {
      case AssetActionId.SEND_PAYMENT:
        // TODO: title + description
        props = {
          id: balance.assetString,
          balance,
          title: `Send payment ${balance.assetCode}`,
          description: "Send payment description",
          callback: onSend,
        };
        break;
      case AssetActionId.SEP24_DEPOSIT:
        // TODO: title + description
        props = {
          id: balance.assetString,
          balance,
          title: `SEP-24 deposit ${balance.assetCode}`,
          description: "SEP-24 deposit description",
          callback: () => handleSep24Deposit(balance),
        };
        break;
      case AssetActionId.SEP24_WITHDRAW:
        // TODO: title + description
        props = {
          id: balance.assetString,
          balance,
          title: `SEP-24 withdrawal ${balance.assetCode}`,
          description: "SEP-24 withdrawal description",
          callback: () => handleSep24Withdraw(balance),
        };
        break;
      case AssetActionId.SEP31_SEND:
        // TODO: title + description
        props = {
          id: balance.assetString,
          balance,
          title: `SEP-31 send ${balance.assetCode}`,
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
        <BalanceRow
          key={balance.assetString}
          activeAsset={activeAsset.asset}
          asset={balance}
          onChange={(e) =>
            handleActionChange({ actionId: e.target.value, balance })
          }
        />
      ))}

      {/* Other balances */}
      {sortedBalances.other.map((balance) => (
        <BalanceRow
          activeAsset={activeAsset.asset}
          key={balance.assetString}
          asset={balance}
          onChange={(e) =>
            handleActionChange({ actionId: e.target.value, balance })
          }
        />
      ))}
    </>
  );
};
