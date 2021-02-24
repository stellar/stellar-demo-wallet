import { TextButton } from "@stellar/design-system";
import { Types } from "@stellar/wallet-sdk";
import { useDispatch } from "react-redux";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { fetchSendFieldsAction } from "ducks/sendSep31";
import { withdrawAssetAction } from "ducks/withdrawAsset";
import { useRedux } from "hooks/useRedux";

interface SortedBalancesResult {
  native: Types.NativeBalance[];
  other: Types.AssetBalance[];
}

export const Balance = ({
  onSend,
}: {
  onSend: (asset?: Types.AssetBalance) => void;
}) => {
  const { account } = useRedux("account");
  const allBalances = account?.data?.balances;

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
        result.other = [...result.other, balance as Types.AssetBalance];
      }

      return result;
    });

    return result;
  };

  const handleDeposit = (asset: Types.AssetBalance) => {
    // TODO: handle global errors on UI
    dispatch(
      depositAssetAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
  };

  const handleWithdraw = (asset: Types.AssetBalance) => {
    // TODO: handle global errors on UI
    dispatch(
      withdrawAssetAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
  };

  const handleSendSep31 = (asset: Types.AssetBalance) => {
    dispatch(
      fetchSendFieldsAction({
        assetCode: asset.token.code,
        assetIssuer: asset.token.issuer.key,
      }),
    );
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
            <TextButton onClick={() => onSend()}>Send</TextButton>
          </div>
        </div>
      ))}

      {/* Other balances */}
      {sortedBalances.other.map((balance) => (
        <div
          className="BalanceRow"
          key={`${balance.token.code}:${balance.token.issuer.key}`}
        >
          <div className="BalanceCell">{`${balance.total || "0"} ${
            balance.token.code
          }`}</div>
          <div className="BalannceCell Inline">
            <TextButton onClick={() => onSend(balance)}>Send</TextButton>

            <TextButton onClick={() => handleDeposit(balance)}>
              Deposit
            </TextButton>
            <TextButton onClick={() => handleWithdraw(balance)}>
              Withdraw
            </TextButton>

            <TextButton onClick={() => handleSendSep31(balance)}>
              Send (SEP-31)
            </TextButton>
          </div>
        </div>
      ))}
    </>
  );
};
