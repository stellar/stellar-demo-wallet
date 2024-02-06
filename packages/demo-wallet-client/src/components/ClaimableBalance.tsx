import { Heading2, TextLink, Layout } from "@stellar/design-system";
import { useDispatch } from "react-redux";
import { BalanceRow } from "components/BalanceRow";
import { claimAssetAction } from "ducks/claimAsset";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { AssetActionItem, ClaimableAsset } from "types/types";

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

  const dispatch: AppDispatch = useDispatch();

  const handleClaim = (balance: ClaimableAsset) => {
    onAssetAction({
      assetString: balance.assetString,
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
      <Layout.Inset>
        <Heading2>Claimable Balances</Heading2>
      </Layout.Inset>
      <div className="Balances">
        {balances.map((balance) => (
          <BalanceRow
            activeAction={activeAsset.action}
            key={balance.assetString}
            asset={balance}
          >
            <TextLink
              onClick={() => handleClaim(balance)}
              disabled={Boolean(activeAsset.action)}
            >
              Claim
            </TextLink>
          </BalanceRow>
        ))}
      </div>
    </div>
  );
};
