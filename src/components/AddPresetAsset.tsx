import { Button, Checkbox, Heading2 } from "@stellar/design-system";
import { presetAsset, PRESET_ASSETS } from "constants/presetAssets";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { TextLink } from "./TextLink";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { settings } = useRedux("settings");

  const onConfirm = () => {
    onClose();
  };

  const renderPresetAssetRow = (asset: presetAsset) => {
    const {
      anchorHomeDomain: homeDomain,
      issuerPublicKey: assetIssuer,
    } = asset;
    const key = `preset-asset-${asset.assetCode}:${homeDomain || assetIssuer}`;
    const issuerLink =
      (homeDomain && `//${homeDomain}/.well-known/stellar.toml`) ||
      (assetIssuer &&
        `${getNetworkConfig(settings.pubnet).url}/accounts/${assetIssuer}`);

    return (
      <div key={key} className="PresetAssetRow">
        <Checkbox id={key} label="" />
        <div>
          <div className="PresetAssetCode">{asset.assetCode}</div>
          <div className="PresetAssetIssuer">
            {homeDomain && (
              <TextLink href={issuerLink} isExternal>
                {homeDomain}
              </TextLink>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Heading2 className="ModalHeading">Add preset asset</Heading2>

      <div className="ModalBody">
        <p>Select one or more assets</p>
        <div className="PresetAssets">
          {PRESET_ASSETS.map(renderPresetAssetRow)}
        </div>
      </div>

      <div className="ModalButtonsFooter">
        <Button onClick={onConfirm}>Confirm</Button>
      </div>
    </>
  );
};
