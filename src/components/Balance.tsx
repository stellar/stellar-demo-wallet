import { useDispatch } from "react-redux";
import { TextLink } from "components/TextLink";
import { BalanceRow } from "components/BalanceRow";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { fetchSendFieldsAction } from "ducks/sep31Send";
import { withdrawAssetAction } from "ducks/sep24WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import {
  Asset,
  AssetActionItem,
  AssetActionId,
  AssetType,
  AssetCategory,
} from "types/types.d";

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
  const { activeAsset, allAssets } = useRedux("activeAsset", "allAssets");
  const allBalances = allAssets.data.filter(
    (a) => a.category === AssetCategory.TRUSTED,
  );

  const dispatch = useDispatch();

  const groupBalances = () => {
    if (!allBalances) {
      return null;
    }

    const result: SortedBalancesResult = {
      native: [],
      other: [],
    };

    allBalances.map((balance) => {
      if (balance.assetType === AssetType.NATIVE) {
        result.native = [...result.native, balance];
      } else {
        result.other = [...result.other, balance];
      }

      return result;
    });

    return result;
  };

  const handleSep24Deposit = (asset: Asset) => {
    dispatch(depositAssetAction(asset));
  };

  const handleSep24Withdraw = (asset: Asset) => {
    dispatch(withdrawAssetAction(asset));
  };

  const handleSep31Send = (asset: Asset) => {
    dispatch(fetchSendFieldsAction(asset));
  };

  const handleAction = ({
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
    const defaultProps = {
      assetString: balance.assetString,
      balance,
    };

    switch (actionId) {
      case AssetActionId.SEND_PAYMENT:
        props = {
          ...defaultProps,
          title: `Send ${balance.assetCode}`,
          description: (
            <p>
              {`Send ${balance.assetCode} on-chain to another account.`}{" "}
              <TextLink
                href="https://developers.stellar.org/docs/tutorials/send-and-receive-payments/"
                isExternal
              >
                Learn more
              </TextLink>
            </p>
          ),
          callback: onSend,
        };
        break;
      case AssetActionId.SEP24_DEPOSIT:
        props = {
          ...defaultProps,
          title: `SEP-24 deposit ${balance.assetCode} (with Trusted Asset)`,
          description: `Start SEP-24 deposit of trusted asset ${balance.assetCode}?`,
          callback: () => handleSep24Deposit(balance),
        };
        break;
      case AssetActionId.SEP24_WITHDRAW:
        props = {
          ...defaultProps,
          title: `SEP-24 withdrawal ${balance.assetCode}`,
          description: `Start SEP-24 withdrawal of ${balance.assetCode}?`,
          callback: () => handleSep24Withdraw(balance),
        };
        break;
      case AssetActionId.SEP31_SEND:
        props = {
          ...defaultProps,
          title: `SEP-31 send ${balance.assetCode}`,
          description: `Start SEP-31 send to ${balance.assetCode}?`,
          callback: () => handleSep31Send(balance),
        };
        break;
      default:
      // do nothing
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
          activeAction={activeAsset.action}
          asset={balance}
          onAction={(actionId, asset) =>
            handleAction({ actionId, balance: asset })
          }
        />
      ))}

      {/* Other balances */}
      {sortedBalances.other.map((balance) => (
        <BalanceRow
          activeAction={activeAsset.action}
          key={balance.assetString}
          asset={balance}
          onAction={(actionId, asset) =>
            handleAction({ actionId, balance: asset })
          }
        />
      ))}
    </>
  );
};
