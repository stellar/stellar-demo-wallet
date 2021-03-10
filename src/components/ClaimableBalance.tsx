import { Heading2, TextButton } from "@stellar/design-system";
import { useDispatch } from "react-redux";
import { BalanceRow } from "components/BalanceRow";
import { claimAssetAction } from "ducks/claimAsset";
import { useRedux } from "hooks/useRedux";
import { AssetActionItem, ClaimableAsset } from "types/types.d";

export const ClaimableBalance = ({
  onAssetAction,
}: {
  onAssetAction: ({
    balance,
    callback,
    title,
    description,
    options,
  }: AssetActionItem) => void;
}) => {
  const { activeAsset, claimableBalances } = useRedux(
    "activeAsset",
    "claimableBalances",
  );
  const balances = claimableBalances.data.records;

  const dispatch = useDispatch();

  const handleClaim = (balance: ClaimableAsset) => {
    onAssetAction({
      id: balance.assetString,
      balance,
      title: `Claim balance ${balance.assetCode}`,
      description: `Claimable balance description ${balance.total} ${balance.assetCode}`,
      callback: () => dispatch(claimAssetAction(balance)),
    });
  };

  if (!balances || !balances.length) {
    return null;
  }

  return (
    <div className="ClaimableBalances">
      <div className="Inset">
        <Heading2>Claimable Balances</Heading2>
      </div>
      <div className="Balances">
        {balances.map((balance) => (
          <BalanceRow
            activeAction={activeAsset.action}
            key={balance.assetString}
            asset={balance}
          >
            <TextButton
              onClick={() => handleClaim(balance)}
              disabled={Boolean(activeAsset.action)}
            >
              Claim
            </TextButton>
          </BalanceRow>
        ))}
      </div>
    </div>
  );
};
