import { Heading2, TextButton } from "@stellar/design-system";
import { Types } from "@stellar/wallet-sdk";
import { useDispatch } from "react-redux";
import { depositAssetAction } from "ducks/depositAsset";
import { useRedux } from "hooks/useRedux";

interface SortedBalancesResult {
  native: Types.NativeBalance[];
  other: Types.AssetBalance[];
}

export const Balance = ({ onSend }: { onSend: () => void }) => {
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

  const handleSend = () => {
    onSend();
  };

  // TODO: update type
  const handleDeposit = (asset: Types.AssetBalance) => {
    // TODO: handle global errors on UI
    dispatch(depositAssetAction(asset));
  };

  // TODO: update type
  const handleWithdraw = (asset: Types.AssetBalance) => {
    // TODO: handleWithdraw
    console.log("asset: ", asset);
  };

  const renderBalances = () => {
    const sortedBalances = groupBalances();

    if (!sortedBalances) {
      return null;
    }

    return (
      <>
        {/* Native (XLM) balance */}
        {sortedBalances.native.map((balance) => (
          <div key={`${balance.token.code}:native`}>
            <div>{`${balance.token.code}: ${balance.total || "0"}`}</div>
            <div className="Inline">
              <TextButton onClick={() => handleSend()}>Send</TextButton>
            </div>
          </div>
        ))}

        {/* Other balances */}
        {sortedBalances.other.map((balance) => (
          <div key={`${balance.token.code}:${balance.token.issuer.key}`}>
            <div>{`${balance.token.code}: ${balance.total || "0"}`}</div>
            <div className="Inline">
              <TextButton onClick={() => handleSend()}>Send</TextButton>

              <TextButton onClick={() => handleDeposit(balance)}>
                Deposit
              </TextButton>
              <TextButton onClick={() => handleWithdraw(balance)}>
                Withdraw
              </TextButton>
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="Block">
      <Heading2>Balances</Heading2>
      {renderBalances()}
    </div>
  );
};
