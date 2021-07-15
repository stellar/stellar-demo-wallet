import { useEffect, useState } from "react";
import { Button, Checkbox, Heading2 } from "@stellar/design-system";
import { presetAsset } from "constants/presetAssets";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { getPresetAssets } from "helpers/getPresetAssets";
import { useRedux } from "hooks/useRedux";
import { TextLink } from "components/TextLink";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { allAssets, settings } = useRedux("allAssets", "settings");
  const [presetAssets, setPresetAssets] = useState<presetAsset[]>([]);
  const [checkedAssets, setCheckedAssets] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    setPresetAssets(getPresetAssets(allAssets.data));
  }, [allAssets]);

  const onConfirm = () => {
    onClose();
  };

  const handleOnChangeCheckbox = (asset: presetAsset) => {
    const updatedCheckedAssets = JSON.parse(JSON.stringify(checkedAssets));

    const key = `${asset.assetCode}:${
      asset.anchorHomeDomain || asset.issuerPublicKey
    }`;
    updatedCheckedAssets[key] = !checkedAssets[key];
    setCheckedAssets(updatedCheckedAssets);
  };

  const renderPresetAssetRow = (asset: presetAsset) => {
    const {
      anchorHomeDomain: homeDomain,
      issuerPublicKey: assetIssuer,
    } = asset;
    const assetId = `${asset.assetCode}:${homeDomain || assetIssuer}`;
    const issuerLink =
      (homeDomain && `//${homeDomain}/.well-known/stellar.toml`) ||
      (assetIssuer &&
        `${getNetworkConfig(settings.pubnet).url}/accounts/${assetIssuer}`);

    return (
      <div key={`preset-asset-${assetId}`} className="PresetAssetRow">
        <Checkbox
          id={assetId}
          label=""
          checked={!!checkedAssets[assetId]}
          onChange={() => {
            handleOnChangeCheckbox(asset);
          }}
        />
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
          {presetAssets.map(renderPresetAssetRow)}
        </div>
      </div>

      <div className="ModalButtonsFooter">
        <Button onClick={onConfirm}>Confirm</Button>
      </div>
    </>
  );
};
