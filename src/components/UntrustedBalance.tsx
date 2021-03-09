import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { TextButton } from "@stellar/design-system";
import { BalanceRow } from "components/BalanceRow";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { trustAssetAction } from "ducks/trustAsset";
import {
  addUntrustedAssetAction,
  removeUntrustedAssetAction,
} from "ducks/untrustedAssets";
import { log } from "helpers/log";
import { removeUntrustedAssetSearchParam } from "helpers/removeUntrustedAssetSearchParam";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  Asset,
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
  const {
    account,
    activeAsset,
    settings,
    trustAsset,
    untrustedAssets,
  } = useRedux(
    "account",
    "activeAsset",
    "settings",
    "trustAsset",
    "untrustedAssets",
  );

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!settings.untrustedAssets) {
      return;
    }

    dispatch(addUntrustedAssetAction(settings.untrustedAssets));
  }, [settings.untrustedAssets, dispatch]);

  const handleTrustAsset = (asset: Asset) => {
    const { assetString, assetCode, assetIssuer } = asset;
    dispatch(trustAssetAction({ assetString, assetCode, assetIssuer }));
  };

  const handleDepositAsset = (asset: Asset) => {
    const { assetCode, assetIssuer } = asset;
    dispatch(
      depositAssetAction({
        assetCode,
        assetIssuer,
      }),
    );
  };

  const handleRemoveAsset = (asset: Asset) => {
    const { assetString } = asset;

    history.push(
      removeUntrustedAssetSearchParam({
        location,
        removeAsset: assetString,
      }),
    );
    dispatch(removeUntrustedAssetAction(assetString));
    log.instruction({ title: `Untrusted asset ${assetString} removed` });
  };

  const handleActionChange = ({
    actionId,
    asset,
  }: {
    actionId: string;
    asset: Asset;
  }) => {
    if (!actionId) {
      return;
    }

    let props: AssetActionItem | undefined;
    const defaultProps = {
      id: asset.assetString,
      balance: asset,
    };

    switch (actionId) {
      case AssetActionId.SEP24_DEPOSIT:
        // TODO: title + description
        props = {
          ...defaultProps,
          title: `SEP-24 deposit ${asset.assetCode}`,
          description: "Untrusted asset SEP-24 deposit description",
          callback: () => handleDepositAsset(asset),
        };
        break;
      case AssetActionId.TRUST_ASSET:
        // TODO: title + description
        props = {
          ...defaultProps,
          title: `Trust asset ${asset.assetCode}`,
          description: "Trust asset description",
          callback: () => handleTrustAsset(asset),
        };
        break;
      case AssetActionId.REMOVE_ASSET:
        // TODO: title + description
        props = {
          ...defaultProps,
          title: `Remove asset ${asset.assetCode}`,
          description: `Asset ${asset.assetCode}:${asset.assetIssuer} does not exist`,
          callback: () => handleRemoveAsset(asset),
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
      {untrustedAssets.data.map((asset: Asset) =>
        asset.isUntrusted ? (
          // Untrusted
          <BalanceRow
            activeAsset={activeAsset.asset}
            key={asset.assetString}
            asset={asset}
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
              disabled={
                account.isUnfunded ||
                Boolean(activeAsset.asset) ||
                trustAsset.status === ActionStatus.PENDING
              }
            >
              Trust asset
            </TextButton>
          </BalanceRow>
        ) : (
          // Does not exist
          <BalanceRow
            activeAsset={activeAsset.asset}
            key={asset.assetString}
            asset={asset}
          >
            <TextButton
              onClick={() =>
                handleActionChange({
                  actionId: AssetActionId.REMOVE_ASSET,
                  asset,
                })
              }
              disabled={
                Boolean(activeAsset.asset) ||
                trustAsset.status === ActionStatus.PENDING
              }
            >
              Remove
            </TextButton>
          </BalanceRow>
        ),
      )}
    </>
  );
};
