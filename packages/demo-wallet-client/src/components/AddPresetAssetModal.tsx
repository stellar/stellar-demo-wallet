import { PresetAsset } from "../types/types";
import {
  getNetworkConfig
} from "demo-wallet-shared/build/helpers/getNetworkConfig";
import {
  Button,
  Checkbox,
  Icon,
  IconButton, InfoBlock,
  Input, Modal,
  TextLink,
} from "@stellar/design-system";
import {
  shortenStellarKey
} from "demo-wallet-shared/build/helpers/shortenStellarKey";
import { useState } from "react";

interface AddPresetAssetModalProps {
  // Data
  presetAssets: PresetAsset[];

  // External state
  errorMessage: string;
  isLoading: boolean;

  // Callbacks
  onConfirm: (selectedAssets: PresetAsset[]) => void;
}

export const AddPresetAssetModal = ({
  presetAssets,
  errorMessage,
  isLoading,
  onConfirm,
}: AddPresetAssetModalProps) => {
  // Internal state management
  const [checkedAssets, setCheckedAssets] = useState<{ [key: string]: boolean }>({});
  const [customDomainAssets, setCustomDomainAssets] = useState<{
    [assetId: string]: { isInputActive: boolean; customDomain: string };
  }>({});

  const getAssetId = (asset: PresetAsset) =>
    `${asset.assetCode}:${asset.homeDomain || asset.issuerPublicKey}`;

  const hasAnySelectedAsset = () =>
    Object.values(checkedAssets).some((isChecked) => isChecked === true);

  const handleAssetToggle = (assetId: string) => {
    const updatedCheckedAssets = { ...checkedAssets };
    updatedCheckedAssets[assetId] = !checkedAssets[assetId];
    setCheckedAssets(updatedCheckedAssets);
  };

  const handleShowCustomDomain = (assetId: string, homeDomain?: string) => {
    setCustomDomainAssets({
      ...customDomainAssets,
      [assetId]: { isInputActive: true, customDomain: homeDomain || "" },
    });
  };

  const handleHideCustomDomain = (assetId: string) => {
    const updated = { ...customDomainAssets };
    delete updated[assetId];
    setCustomDomainAssets(updated);
  };

  const handleUpdateCustomDomain = (assetId: string, value: string) => {
    const assetState = customDomainAssets?.[assetId];
    if (assetState) {
      setCustomDomainAssets({
        ...customDomainAssets,
        [assetId]: { ...assetState, customDomain: value },
      });
    }
  };

  const handleConfirm = () => {
    const selectedAssets = presetAssets.flatMap((pAsset) => {
      const assetId = getAssetId(pAsset);
      const customHomeDomain = customDomainAssets?.[assetId]?.customDomain;
      const assetData = customHomeDomain
        ? { ...pAsset, homeDomain: customHomeDomain }
        : pAsset;
      return checkedAssets[assetId] ? assetData : [];
    });
    onConfirm(selectedAssets);
  };

  const renderAssetRow = (asset: PresetAsset) => {
    const { homeDomain, issuerPublicKey: assetIssuer } = asset;
    const assetId = getAssetId(asset);
    const networkUrl = getNetworkConfig().url.replace("https:", "");
    const updatedAsset = customDomainAssets?.[assetId];

    const renderHomeDomain = () => {
      if (updatedAsset?.isInputActive) {
        return (
          <div className="PresetAssetIssuer">
            <Input
              id={`custom-domain-${assetId}`}
              value={updatedAsset?.customDomain || ""}
              onChange={(e) => handleUpdateCustomDomain(assetId, e.currentTarget.value)}
            />
            <IconButton
              icon={<Icon.XCircle />}
              altText="Remove home domain override"
              onClick={() => handleHideCustomDomain(assetId)}
              variant={IconButton.variant.error}
            />
          </div>
        );
      }

      return (
        <div className="PresetAssetIssuer">
          {homeDomain ? (
            <>
              <TextLink href={`//${homeDomain}/.well-known/stellar.toml`}>
                {homeDomain}
              </TextLink>
              <IconButton
                icon={<Icon.Edit2 />}
                altText="Override home domain"
                onClick={() => handleShowCustomDomain(assetId, homeDomain )}
              />
            </>
          ) : (
            <TextLink onClick={() => handleShowCustomDomain(assetId, homeDomain)}>
              Override home domain
            </TextLink>
          )}
        </div>
      );
    };
    return (
      <div key={`preset-asset-${assetId}`} className="PresetAssetRow">
        <Checkbox
          id={assetId}
          label=""
          checked={Boolean(checkedAssets[assetId])}
          onChange={() => handleAssetToggle(assetId)}
          disabled={isLoading}
        />
        <div className="PresetAssetRow__content">
          <div className="PresetAssetCode">{asset.assetCode}</div>
          {assetIssuer ? (
            <div className="PresetAssetIssuer">
              <TextLink href={`${networkUrl}/accounts/${assetIssuer}`}>
                {shortenStellarKey(assetIssuer)}
              </TextLink>
            </div>
          ) : null}
          {renderHomeDomain()}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal.Heading>Add preset asset</Modal.Heading>

      <Modal.Body>
        <p>Select one or more assets</p>
        <div className="PresetAssets">{presetAssets.map(renderAssetRow)}</div>

        {errorMessage && (
          <InfoBlock variant={InfoBlock.variant.error}>
            <p>{errorMessage}</p>
          </InfoBlock>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleConfirm}
          disabled={!hasAnySelectedAsset()}
          isLoading={isLoading}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </>
  );
}