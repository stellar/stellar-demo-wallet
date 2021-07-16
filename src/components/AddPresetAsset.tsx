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
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { getPresetAssets } from "helpers/getPresetAssets";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { log } from "helpers/log";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, presetAsset, SearchParams } from "types/types.d";
import { shortenStellarKey } from "helpers/shortenStellarKey";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, allAssets, settings, untrustedAssets } = useRedux(
    "account",
    "allAssets",
    "settings",
    "untrustedAssets",
  );
  const [presetAssets, setPresetAssets] = useState<presetAsset[]>([]);
  const checkedAssets: { [key: string]: boolean } = {};
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const history = useHistory();

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
            networkUrl: getNetworkConfig(settings.pubnet).url,
          });

          return `${asset.assetCode}:${asset.assetIssuer}`;
        }),
      );

      const newSearchQ = searchParam.update(
        SearchParams.UNTRUSTED_ASSETS,
        validatedAssetValues.join(","),
      );
      history.push(newSearchQ);
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
    const networkUrl = getNetworkConfig(settings.pubnet).url.replace(
      "https:",
      "",
    );

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
          onChange={() => {
            checkedAssets[assetId] = !checkedAssets[assetId];
          }}
          disabled={isPending}
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
            const assetsToAdd = presetAssets.flatMap((pAsset) => {
              const assetId = getAssetId(pAsset);
              return checkedAssets[assetId] ? pAsset : [];
            });
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
