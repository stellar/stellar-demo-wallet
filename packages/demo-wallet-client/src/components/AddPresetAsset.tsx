import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  InfoBlock,
  TextLink,
  Modal,
} from "@stellar/design-system";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { getPresetAssets } from "demo-wallet-shared/build/helpers/getPresetAssets";
import { getValidatedUntrustedAsset } from "demo-wallet-shared/build/helpers/getValidatedUntrustedAsset";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, presetAsset, SearchParams } from "types/types";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, allAssets, untrustedAssets } = useRedux(
    "account",
    "allAssets",
    "untrustedAssets",
  );
  const [presetAssets, setPresetAssets] = useState<presetAsset[]>([]);
  const [checkedAssets, setCheckedAssets] = useState<{
    [key: string]: boolean;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setPresetAssets(getPresetAssets(allAssets.data));
  }, [allAssets]);

  useEffect(() => {
    if (untrustedAssets.status === ActionStatus.SUCCESS) {
      onClose();
    }

    if (untrustedAssets.errorString) {
      setErrorMessage(untrustedAssets.errorString);
    }
  }, [onClose, untrustedAssets.errorString, untrustedAssets.status]);

  const getAssetId = (asset: presetAsset) =>
    `${asset.assetCode}:${asset.homeDomain || asset.issuerPublicKey}`;

  const hasAnySelectedAsset = () =>
    Object.values(checkedAssets).some((isChecked) => isChecked === true);

  const handleAddUntrustedAssets = async (assetList: presetAsset[]) => {
    setErrorMessage("");
    setIsValidating(true);

    try {
      const validatedAssetValues = await Promise.all(
        assetList.map(async (pAsset) => {
          const { assetCode, issuerPublicKey, homeDomain } = pAsset;

          if (!(homeDomain || issuerPublicKey)) {
            const errorMsg = `Home domain OR issuer public key is required with asset code ${assetCode}`;
            throw new Error(errorMsg);
          }

          const asset = await getValidatedUntrustedAsset({
            assetCode,
            homeDomain,
            issuerPublicKey,
            accountBalances: account.data?.balances,
            networkUrl: getNetworkConfig().url,
          });

          return `${asset.assetCode}:${asset.assetIssuer}`;
        }),
      );

      const newSearchQ = searchParam.update(
        SearchParams.UNTRUSTED_ASSETS,
        validatedAssetValues.join(","),
      );
      navigate(newSearchQ);
    } catch (e) {
      const errorMsg = getErrorMessage(e);
      log.error({ title: errorMsg });
      setErrorMessage(errorMsg);
      setIsValidating(false);
      return;
    }

    setIsValidating(false);
  };

  const isPending =
    isValidating || untrustedAssets.status === ActionStatus.PENDING;

  const renderAssetRow = (asset: presetAsset) => {
    const { homeDomain, issuerPublicKey: assetIssuer } = asset;

    const assetId = getAssetId(asset);
    const networkUrl = getNetworkConfig().url.replace("https:", "");

    // if no home domain is provided, use horizon's /account endpoint:
    const issuerLink =
      (homeDomain && `//${homeDomain}/.well-known/stellar.toml`) ||
      (assetIssuer && `${networkUrl}/accounts/${assetIssuer}`);
    const displayLink =
      homeDomain || (assetIssuer && shortenStellarKey(assetIssuer));

    return (
      <div key={`preset-asset-${assetId}`} className="PresetAssetRow">
        <Checkbox
          id={assetId}
          label=""
          checked={Boolean(checkedAssets[assetId])}
          onChange={() => {
            const updatedCheckedAssets = { ...checkedAssets };
            updatedCheckedAssets[assetId] = !checkedAssets[assetId];
            setCheckedAssets(updatedCheckedAssets);
          }}
          disabled={isPending}
        />
        <div>
          <div className="PresetAssetCode">{asset.assetCode}</div>
          <div className="PresetAssetIssuer">
            {displayLink && (
              <TextLink href={issuerLink}>{displayLink}</TextLink>
            )}
          </div>
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
          onClick={() => {
            const assetsToAdd = presetAssets.flatMap((pAsset) => {
              const assetId = getAssetId(pAsset);
              return checkedAssets[assetId] ? pAsset : [];
            });
            handleAddUntrustedAssets(assetsToAdd);
          }}
          disabled={!hasAnySelectedAsset()}
          isLoading={isPending}
        >
          Confirm
        </Button>
      </Modal.Footer>
    </>
  );
};
