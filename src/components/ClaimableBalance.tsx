import { Heading2, TextButton } from "@stellar/design-system";
import { useDispatch } from "react-redux";
import { claimAssetAction } from "ducks/claimAsset";
import { useRedux } from "hooks/useRedux";
import { CleanedClaimableBalanceRecord } from "types/types.d";

export const ClaimableBalance = () => {
  const { claimableBalances } = useRedux("claimableBalances");
  const balances = claimableBalances.data.records;

  const dispatch = useDispatch();

  const handleClaim = (balance: CleanedClaimableBalanceRecord) => {
    dispatch(claimAssetAction(balance));
  };

  if (!balances || !balances.length) {
    return null;
  }

  return (
    <div className="ClaimableBalances">
      <Heading2>Claimable Balances</Heading2>
      <div className="Balances">
        {balances.map((balance) => {
          const [assetCode] = balance.asset.split(":");

          return (
            <div key={balance.id} className="BalanceRow">
              <div className="BalanceCell">{`${
                balance.amount || "0"
              } ${assetCode}`}</div>
              <div className="BalanceCell Inline">
                <TextButton onClick={() => handleClaim(balance)}>
                  Claim
                </TextButton>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
