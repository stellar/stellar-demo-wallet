import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";
import { depositAssetAction } from "ducks/depositAsset";
import { trustAssetAction } from "ducks/trustAsset";
import { addUntrustedAssetAction } from "ducks/untrustedAssets";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, UntrustedAsset } from "types/types.d";

export const UntrustedBalance = () => {
  const { settings, trustAsset, untrustedAssets } = useRedux(
    "settings",
    "trustAsset",
    "untrustedAssets",
  );

  const dispatch = useDispatch();

  // TODO: we can move this someplace else (SettingsHandler, for example)
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
    // TODO: handle global errors on UI
    const { assetCode, assetIssuer } = asset;
    dispatch(
      depositAssetAction({
        assetCode,
        assetIssuer,
      }),
    );
  };

  return (
    <div className="Block">
      {untrustedAssets.data.map((asset: UntrustedAsset) => (
        <div key={`${asset.assetCode}:${asset.assetIssuer}`}>
          <div>{`${asset.assetCode}: ${asset.balance}`}</div>
          <div className="Inline">
            <TextButton
              onClick={() => handleTrustAsset(asset)}
              disabled={trustAsset.status === ActionStatus.PENDING}
            >
              Trust asset
            </TextButton>
            <TextButton onClick={() => handleDepositAsset(asset)}>
              Deposit
            </TextButton>
          </div>
        </div>
      ))}
    </div>
  );
};
