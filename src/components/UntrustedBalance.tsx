import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";
import { addUntrustedAssetAction } from "ducks/untrustedAssets";
import { useRedux } from "hooks/useRedux";
import { UntrustedAsset } from "types/types.d";

export const UntrustedBalance = () => {
  const { settings, untrustedAssets } = useRedux("settings", "untrustedAssets");

  const dispatch = useDispatch();

  useEffect(() => {
    if (!settings.untrustedAssets) {
      return;
    }

    dispatch(addUntrustedAssetAction(settings.untrustedAssets));
  }, [settings.untrustedAssets, dispatch]);

  const handleTrustAsset = (asset: UntrustedAsset) => {
    // TODO: handleTrustAsset
    console.log("handleTrustAsset: ", asset);
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
            <TextButton onClick={() => handleTrustAsset(asset)}>
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
