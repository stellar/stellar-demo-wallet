import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";
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
    dispatch(trustAssetAction(asset));
  };

  const handleDepositAsset = (asset: UntrustedAsset) => {
    // TODO: handleDepositAsset
    console.log("handleDepositAsset: ", asset);
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
