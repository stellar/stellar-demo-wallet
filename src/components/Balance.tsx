import { Types } from "@stellar/wallet-sdk";
import { useDispatch } from "react-redux";
import { BalanceRow } from "components/BalanceRow";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { fetchSendFieldsAction } from "ducks/sep31Send";
import { withdrawAssetAction } from "ducks/sep24WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import {
  AssetActionItem,
  AssetWithSupportedActions,
  AssetActionId,
} from "types/types.d";

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
      case AssetActionId.SEND_PAYMENT:
        // TODO: title + description
        props = {
          balance,
          title: `Send payment ${balance.token.code}`,
          description: "Send payment description",
          callback: onSend,
        };
        break;
      case AssetActionId.SEP24_DEPOSIT:
        // TODO: title + description
        props = {
          balance,
          title: `SEP-24 deposit ${balance.token.code}`,
          description: "SEP-24 deposit description",
          callback: () => handleSep24Deposit(balance),
        };
        break;
      case AssetActionId.SEP24_WITHDRAW:
        // TODO: title + description
        props = {
          balance,
          title: `SEP-24 withdrawal ${balance.token.code}`,
          description: "SEP-24 withdrawal description",
          callback: () => handleSep24Withdraw(balance),
        };
        break;
      case AssetActionId.SEP31_SEND:
        // TODO: title + description
        props = {
          balance,
          title: `SEP-31 send ${balance.token.code}`,
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
          key={`${balance.token.code}:native`}
          asset={{
            id: `${balance.token.code}:native`,
            code: balance.token.code,
            amount: balance.total.toString(),
          }}
          onChange={(e) =>
            handleActionChange({ actionId: e.target.value, balance })
          }
        />
      ))}

      {/* Other balances */}
      {sortedBalances.other.map((balance) => (
        <BalanceRow
          key={`${balance.token.code}:${balance.token?.issuer?.key}`}
          asset={{
            id: `${balance.token.code}:${balance.token?.issuer?.key}`,
            code: balance.token.code,
            amount: balance.total.toString(),
            supportedActions: balance?.supportedActions,
          }}
          onChange={(e) =>
            handleActionChange({ actionId: e.target.value, balance })
          }
        />
      ))}
    </>
  );
};
