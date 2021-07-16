import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  Checkbox,
  Heading2,
  InfoBlock,
  InfoBlockVariant,
  Loader,
} from "@stellar/design-system";
import { TextLink } from "components/TextLink";
import { presetAsset } from "constants/presetAssets";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { getPresetAssets } from "helpers/getPresetAssets";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { log } from "helpers/log";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";
import { shortenStellarKey } from "helpers/shortenStellarKey";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, allAssets, settings, untrustedAssets } = useRedux(
    "account",
    "allAssets",
    "settings",
    "untrustedAssets",
  );
  const [presetAssets, setPresetAssets] = useState<presetAsset[]>([]);
  const [checkedAssets, setCheckedAssets] = useState<{
    [key: string]: boolean;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const history = useHistory();

  useEffect(() => {
    setPresetAssets(getPresetAssets(allAssets.data));
  }, [allAssets]);

  useEffect(() => {
    setTimeout(() => {
      if (!isValidating && untrustedAssets.status === ActionStatus.SUCCESS) {
        onClose();
      }
    }, 100);

    if (untrustedAssets.errorString) {
      setErrorMessage(untrustedAssets.errorString);
    }
  }, [
    isValidating,
    onClose,
    untrustedAssets.errorString,
    untrustedAssets.status,
  ]);

  const getAssetId = (asset: presetAsset) =>
    `${asset.assetCode}:${asset.homeDomain || asset.issuerPublicKey}`;

  const getAssetsToAdd = () => {
    const assetsToAdd: presetAsset[] = [];

    presetAssets.forEach((pAsset) => {
      const assetId = getAssetId(pAsset);
      if (checkedAssets[assetId]) {
        assetsToAdd.push(pAsset);
      }
    });

    return assetsToAdd;
  };

  const handleOnChangeCheckbox = (asset: presetAsset) => {
    const updatedCheckedAssets = JSON.parse(JSON.stringify(checkedAssets));
    const assetId = getAssetId(asset);
    updatedCheckedAssets[assetId] = !checkedAssets[assetId];
    setCheckedAssets(updatedCheckedAssets);
  };

  const handleAddUntrustedAssets = async (assetList: presetAsset[]) => {
    setErrorMessage("");
    setIsValidating(true);

    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < assetList.length; i++) {
      const pAsset = assetList[i];
      const { assetCode, issuerPublicKey, homeDomain } = pAsset;

      if (!(homeDomain || issuerPublicKey)) {
        const errorMsg = `Home domain OR issuer public key is required with asset code ${assetCode}`;
        log.error({ title: errorMsg });
        setErrorMessage(errorMsg);
        setIsValidating(false);
        return;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        const asset = await getValidatedUntrustedAsset({
          assetCode,
          homeDomain,
          issuerPublicKey,
          accountBalances: account.data?.balances,
          networkUrl: getNetworkConfig(settings.pubnet).url,
        });

        let search = searchParam.update(
          SearchParams.UNTRUSTED_ASSETS,
          `${asset.assetCode}:${asset.assetIssuer}`,
        );

        if (asset.homeDomain) {
          search = searchParam.updateKeyPair({
            param: SearchParams.ASSET_OVERRIDES,
            itemId: `${asset.assetCode}:${asset.assetIssuer}`,
            keyPairs: { homeDomain: asset.homeDomain },
            urlSearchParams: new URLSearchParams(search),
          });
        }

        history.push(search);
      } catch (e) {
        const errorMsg = getErrorMessage(e);
        log.error({ title: errorMsg });
        setErrorMessage(errorMsg);
        setIsValidating(false);
        return;
      }
    }

    setIsValidating(false);
  };

  const renderAssetRow = (asset: presetAsset) => {
    const { homeDomain, issuerPublicKey: assetIssuer } = asset;
    const assetId = getAssetId(asset);
    const issuerLink =
      (homeDomain && `//${homeDomain}/.well-known/stellar.toml`) ||
      (assetIssuer &&
        `${getNetworkConfig(settings.pubnet).url.replace(
          "https:",
          "",
        )}/accounts/${assetIssuer}`);
    const displayLink =
      homeDomain || (assetIssuer && shortenStellarKey(assetIssuer));

    return (
      <div key={`preset-asset-${assetId}`} className="PresetAssetRow">
        <Checkbox
          id={assetId}
          label=""
          checked={!!checkedAssets[assetId]}
          onChange={() => {
            handleOnChangeCheckbox(asset);
          }}
          disabled={isValidating}
        />
        <div>
          <div className="PresetAssetCode">{asset.assetCode}</div>
          <div className="PresetAssetIssuer">
            {displayLink && (
              <TextLink href={issuerLink} isExternal>
                {displayLink}
              </TextLink>
            )}
          </div>
        </div>
      </div>
    );
  };

  const isPending =
    isValidating || untrustedAssets.status === ActionStatus.PENDING;

  return (
    <>
      <Heading2 className="ModalHeading">Add preset asset</Heading2>

      <div className="ModalBody">
        <p>Select one or more assets</p>
        <div className="PresetAssets">{presetAssets.map(renderAssetRow)}</div>

        {errorMessage && (
          <InfoBlock variant={InfoBlockVariant.error}>
            <p>{errorMessage}</p>
          </InfoBlock>
        )}
      </div>

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button
          onClick={() => {
            const assetsToAdd = getAssetsToAdd();
            handleAddUntrustedAssets(assetsToAdd);
          }}
          disabled={isPending}
        >
          Confirm
        </Button>
      </div>
    </>
  );
};
