import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { TextButton } from "@stellar/design-system";
import { BalanceRow } from "components/BalanceRow";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { depositAssetAction } from "ducks/sep24DepositAsset";
import { trustAssetAction } from "ducks/trustAsset";
import {
  addUntrustedAssetAction,
  removeUntrustedAssetAction,
  resetUntrustedAssetStatusAction,
} from "ducks/untrustedAssets";
import { log } from "helpers/log";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  Asset,
  AssetActionItem,
  AssetActionId,
  SearchParams,
  AssetCategory,
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
  const { account, activeAsset, allAssets, settings, trustAsset } = useRedux(
    "account",
    "activeAsset",
    "allAssets",
    "settings",
    "trustAsset",
  );

  const dispatch = useDispatch();
  const history = useHistory();

  const allUntrustedAssets = allAssets.data.filter(
    (a) => a.category === AssetCategory.UNTRUSTED,
  );

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
      searchParam.remove(SearchParams.UNTRUSTED_ASSETS, assetString),
    );
    dispatch(removeUntrustedAssetAction(assetString));
    log.instruction({ title: `Untrusted asset ${assetString} removed` });

    dispatch(resetUntrustedAssetStatusAction());
    dispatch(resetActiveAssetAction());
  };

  const handleRemoveHomeDomainOverride = (asset: Asset) => {
    history.push(
      searchParam.removeKeyPair({
        searchParam: SearchParams.ASSET_OVERRIDES,
        itemId: asset.assetString,
      }),
    );
    dispatch(resetActiveAssetAction());
  };

  const handleAction = ({
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
      assetString: asset.assetString,
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
      case AssetActionId.REMOVE_ASSET_OVERRIDE:
        // TODO: title + description
        props = {
          ...defaultProps,
          title: `Remove ${asset.assetCode} asset override`,
          description: `Home domain will be remove`,
          callback: () => handleRemoveHomeDomainOverride(asset),
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

  const disabledButton =
    Boolean(activeAsset.action) || trustAsset.status === ActionStatus.PENDING;

  return (
    <>
      {allUntrustedAssets.map((asset: Asset) =>
        asset.isUntrusted ? (
          // Untrusted
          <BalanceRow
            activeAction={activeAsset.action}
            key={asset.assetString}
            asset={asset}
            onAction={(actionId, assetItem) =>
              handleAction({ actionId, asset: assetItem })
            }
          >
            <TextButton
              onClick={() =>
                handleAction({
                  actionId: AssetActionId.TRUST_ASSET,
                  asset,
                })
              }
              disabled={account.isUnfunded || disabledButton}
            >
              Trust asset
            </TextButton>
          </BalanceRow>
        ) : (
          // Does not exist
          <BalanceRow
            activeAction={activeAsset.action}
            key={asset.assetString}
            asset={asset}
          >
            <TextButton
              onClick={() =>
                handleAction({
                  actionId: AssetActionId.REMOVE_ASSET,
                  asset,
                })
              }
              disabled={disabledButton}
            >
              Remove
            </TextButton>
          </BalanceRow>
        ),
      )}
    </>
  );
};
