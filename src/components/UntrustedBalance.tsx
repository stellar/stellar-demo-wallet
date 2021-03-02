import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";
import { BalanceRow } from "components/BalanceRow";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { trustAssetAction } from "ducks/trustAsset";
import { addUntrustedAssetAction } from "ducks/untrustedAssets";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  UntrustedAsset,
  AssetActionItem,
  AssetActionId,
} from "types/types.d";

export const UntrustedBalance = ({
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
  const { settings, trustAsset, untrustedAssets } = useRedux(
    "settings",
    "trustAsset",
    "untrustedAssets",
  );

  const dispatch = useDispatch();

  useEffect(() => {
    if (!settings.untrustedAssets) {
      return;
    }

    dispatch(addUntrustedAssetAction(settings.untrustedAssets));
  }, [settings.untrustedAssets, dispatch]);

  const handleTrustAsset = (asset: UntrustedAsset) => {
    const { assetString, assetCode, assetIssuer } = asset;
    dispatch(trustAssetAction({ assetString, assetCode, assetIssuer }));
  };

  const handleDepositAsset = (asset: UntrustedAsset) => {
    const { assetCode, assetIssuer } = asset;
    dispatch(
      depositAssetAction({
        assetCode,
        assetIssuer,
      }),
    );
  };

  const handleActionChange = ({
    actionId,
    asset,
  }: {
    actionId: string;
    asset: UntrustedAsset;
  }) => {
    if (!actionId) {
      return;
    }

    let props: AssetActionItem | undefined;

    switch (actionId) {
      case AssetActionId.SEP24_DEPOSIT:
        // TODO: title + description
        props = {
          balance: asset,
          title: `SEP-24 deposit ${asset.assetCode}`,
          description: "Untrusted asset SEP-24 deposit description",
          callback: () => handleDepositAsset(asset),
        };
        break;
      case AssetActionId.TRUST_ASSET:
        // TODO: title + description
        props = {
          balance: asset,
          title: `Trust asset ${asset.assetCode}`,
          description: "Trust asset description",
          callback: () => handleTrustAsset(asset),
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

  return (
    <>
      {untrustedAssets.data.map((asset: UntrustedAsset) => (
        <BalanceRow
          key={asset.assetString}
          asset={{
            id: asset.assetString,
            code: asset.assetCode,
            amount: asset.balance,
            supportedActions: asset.supportedActions,
            isUntrusted: true,
          }}
          onChange={(e) =>
            handleActionChange({ actionId: e.target.value, asset })
          }
        >
          <TextButton
            onClick={() =>
              handleActionChange({
                actionId: AssetActionId.TRUST_ASSET,
                asset,
              })
            }
            disabled={trustAsset.status === ActionStatus.PENDING}
          >
            Trust asset
          </TextButton>
        </BalanceRow>
      ))}
    </>
  );
};
