import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Checkbox,
  InfoBlock,
  TextLink,
  Modal,
  IconButton,
  Icon,
  Input,
} from "@stellar/design-system";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { getPresetAssets } from "demo-wallet-shared/build/helpers/getPresetAssets";
import { getValidatedUntrustedAsset } from "demo-wallet-shared/build/helpers/getValidatedUntrustedAsset";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  AnyObject,
  PresetAsset,
  SearchParams,
} from "types/types";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, allAssets, untrustedAssets } = useRedux(
    "account",
    "allAssets",
    "untrustedAssets",
  );
  const [presetAssets, setPresetAssets] = useState<PresetAsset[]>([]);
  const [checkedAssets, setCheckedAssets] = useState<{
    [key: string]: boolean;
  }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [customDomainAssets, setCustomDomainAssets] = useState<{
    [assetId: string]: { isInputActive: boolean; customDomain: string };
  }>();

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

  const getAssetId = (asset: PresetAsset) =>
    `${asset.assetCode}:${asset.homeDomain || asset.issuerPublicKey}`;

  const hasAnySelectedAsset = () =>
    Object.values(checkedAssets).some((isChecked) => isChecked === true);

  const handleAddUntrustedAssets = async (assetList: PresetAsset[]) => {
    setErrorMessage("");
    setIsValidating(true);

    try {
      const params: {
        untrustedAssets: string[];
        assetOverrides: AnyObject[];
      } = {
        untrustedAssets: [],
        assetOverrides: [],
      };

      for (let i = 0; i < assetList.length; i++) {
        const { assetCode, issuerPublicKey, homeDomain } = assetList[i];

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

        const itemId = `${asset.assetCode}:${asset.assetIssuer}`;
        params.untrustedAssets.push(itemId);

        // Home domain override
        if (asset.homeDomain) {
          params.assetOverrides.push({
            itemId,
            keyPairs: { homeDomain: asset.homeDomain },
          });
        }
      }

      let search = searchParam.update(
        SearchParams.UNTRUSTED_ASSETS,
        params.untrustedAssets.join(","),
      );

      params.assetOverrides.forEach((a) => {
        search = searchParam.updateKeyPair({
          param: SearchParams.ASSET_OVERRIDES,
          itemId: a.itemId,
          keyPairs: a.keyPairs,
          urlSearchParams: new URLSearchParams(search),
        });
      });

      navigate(search);
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

  const renderAssetRow = (asset: PresetAsset) => {
    const { homeDomain, issuerPublicKey: assetIssuer } = asset;

    const assetId = getAssetId(asset);
    const networkUrl = getNetworkConfig().url.replace("https:", "");
    const updatedAsset = customDomainAssets?.[assetId];

    const showCustomDomainInput = () => {
      setErrorMessage("");
      setCustomDomainAssets({
        ...customDomainAssets,
        [assetId]: { isInputActive: true, customDomain: homeDomain || "" },
      });
    };

    const hideCustomDomainInput = () => {
      const updated = { ...customDomainAssets };
      delete updated[assetId];

      setErrorMessage("");
      setCustomDomainAssets({
        ...updated,
      });
    };

    const updateCustomDomainValue = (value: string) => {
      setErrorMessage("");

      if (value) {
        const assetState = customDomainAssets?.[assetId];

        if (!assetState) {
          return;
        }

        setCustomDomainAssets({
          ...customDomainAssets,
          [assetId]: { ...assetState, customDomain: value },
        });
      }
    };

    const renderHomeDomain = () => {
      if (updatedAsset?.isInputActive) {
        return (
          <div className="PresetAssetIssuer">
            <Input
              id={`custom-domain-${assetId}`}
              value={updatedAsset?.customDomain || ""}
              onChange={(e) => updateCustomDomainValue(e.currentTarget.value)}
            />
            <IconButton
              icon={<Icon.XCircle />}
              altText="Remove home domain override"
              onClick={hideCustomDomainInput}
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
                onClick={showCustomDomainInput}
              />
            </>
          ) : (
            <TextLink onClick={showCustomDomainInput}>
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
          onChange={() => {
            const updatedCheckedAssets = { ...checkedAssets };
            updatedCheckedAssets[assetId] = !checkedAssets[assetId];
            setCheckedAssets(updatedCheckedAssets);
          }}
          disabled={isPending}
        />
        <div className="PresetAssetRow__content">
          <div className="PresetAssetCode">{asset.assetCode}</div>
          {assetIssuer ? (
            <div className="PresetAssetIssuer">
              {/* if no home domain is provided, use horizon's /account endpoint: */}
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
          onClick={() => {
            const assetsToAdd = presetAssets.flatMap((pAsset) => {
              const assetId = getAssetId(pAsset);
              const customHomeDomain =
                customDomainAssets?.[assetId]?.customDomain;
              const assetData = customHomeDomain
                ? { ...pAsset, homeDomain: customHomeDomain }
                : pAsset;
              return checkedAssets[assetId] ? assetData : [];
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
