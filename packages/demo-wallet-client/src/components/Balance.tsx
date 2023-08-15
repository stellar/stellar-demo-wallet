import { useDispatch } from "react-redux";
import { TextLink } from "@stellar/design-system";

import { BalanceRow } from "components/BalanceRow";
import { initiateDepositAction as initiateSep6SendAction } from "ducks/sep6DepositAsset";
import { initiateWithdrawAction as initiateSep6WithdrawAction } from "ducks/sep6WithdrawAsset";
import { initiateSep8SendAction } from "ducks/sep8Send";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { initiateSendAction } from "ducks/sep31Send";
import { withdrawAssetAction } from "ducks/sep24WithdrawAsset";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import {
  Asset,
  AssetActionItem,
  AssetActionId,
  AssetType,
  AssetCategory,
} from "types/types";

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
    showCustodial,
  }: AssetActionItem) => void;
  onSend: (asset?: Asset) => void;
}) => {
  const { activeAsset, allAssets } = useRedux("activeAsset", "allAssets");
  const allBalances = allAssets.data.filter(
    (a) => a.category === AssetCategory.TRUSTED,
  );

  const dispatch: AppDispatch = useDispatch();

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

  const handleSep6Deposit = (asset: Asset) => {
    dispatch(initiateSep6SendAction(asset));
  };

  const handleSep6Withdraw = (asset: Asset) => {
    dispatch(initiateSep6WithdrawAction(asset));
  };

  const handleSep8Send = (asset: Asset) => {
    dispatch(initiateSep8SendAction(asset));
  };

  const handleSep24Deposit = (asset: Asset) => {
    dispatch(depositAssetAction(asset));
  };

  const handleSep24Withdraw = (asset: Asset) => {
    dispatch(withdrawAssetAction(asset));
  };

  const handleSep31Send = (asset: Asset) => {
    dispatch(initiateSendAction(asset));
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

    const isNative = isNativeAsset(balance.assetCode);

    switch (actionId) {
      case AssetActionId.SEND_PAYMENT:
        props = {
          ...defaultProps,
          title: `Send ${balance.assetCode}`,
          description: (
            <p>
              {`Send ${balance.assetCode} on-chain to another account.`}{" "}
              <TextLink href="https://developers.stellar.org/docs/tutorials/send-and-receive-payments/">
                Learn more
              </TextLink>
            </p>
          ),
          callback: onSend,
        };
        break;
      case AssetActionId.SEP6_DEPOSIT:
        props = {
          ...defaultProps,
          title: `SEP-6 deposit ${balance.assetCode} (with Trusted Asset)`,
          description: `Start SEP-6 deposit of trusted asset ${balance.assetCode}?`,
          callback: () => handleSep6Deposit(balance),
        };
        break;
      case AssetActionId.SEP6_WITHDRAW:
        props = {
          ...defaultProps,
          title: `SEP-6 withdrawal ${balance.assetCode}`,
          description: `Start SEP-6 withdrawal of ${balance.assetCode}?`,
          callback: () => handleSep6Withdraw(balance),
        };
        break;
      case AssetActionId.SEP8_SEND_PAYMENT:
        props = {
          ...defaultProps,
          title: `SEP-8 send ${balance.assetCode}`,
          description: (
            <p>
              {`Payments with regulated assets need to be approved by the asset issuer. For more information please refer to`}{" "}
              <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md">
                SEP-8
              </TextLink>
              .
            </p>
          ),
          callback: () => handleSep8Send(balance),
        };
        break;
      case AssetActionId.SEP24_DEPOSIT:
        props = {
          ...defaultProps,
          title: `SEP-24 deposit ${balance.assetCode} ${
            isNative ? "(with Native Asset)" : "(with Trusted Asset)"
          }`,
          description: `Start SEP-24 deposit of ${
            isNative ? "native" : "trusted"
          } asset ${balance.assetCode}?`,
          callback: () => handleSep24Deposit(balance),
          showCustodial: true,
        };
        break;
      case AssetActionId.SEP24_WITHDRAW:
        props = {
          ...defaultProps,
          title: `SEP-24 withdrawal ${balance.assetCode}`,
          description: `Start SEP-24 withdrawal of ${balance.assetCode}?`,
          callback: () => handleSep24Withdraw(balance),
          showCustodial: true,
        };
        break;
      case AssetActionId.SEP31_SEND: {
        let description = `Start SEP-31 send to ${balance.assetCode}?\n\n`;
        description +=
          "Please be aware that specifically in the case of demo-ing SEP-31 in the Demo Wallet the public and secret keys don't represent the Sending Client but instead the Sending Anchor's account.\n\n";
        description +=
          "In SEP-31, the only Stellar transaction happening is between the Sending and the Receiving anchors.";
        props = {
          ...defaultProps,
          title: `SEP-31 send ${balance.assetCode}`,

          description,
          callback: () => handleSep31Send(balance),
        };
        break;
      }
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
