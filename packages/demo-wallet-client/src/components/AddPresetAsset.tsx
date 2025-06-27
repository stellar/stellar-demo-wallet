import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { getPresetAssets } from "demo-wallet-shared/build/helpers/getPresetAssets";
import { getValidatedAsset } from "demo-wallet-shared/build/helpers/getValidatedAsset";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  AnyObject,
  PresetAsset,
  SearchParams,
} from "types/types";
import { PRESET_ASSETS } from "demo-wallet-shared/build/constants/presetAssets";
import { AddPresetAssetModal } from "./AddPresetAssetModal";

export const AddPresetAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, allAssets, untrustedAssets } = useRedux(
    "account",
    "allAssets",
    "untrustedAssets",
  );
  const [presetAssets, setPresetAssets] = useState<PresetAsset[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setPresetAssets(getPresetAssets(allAssets.data, PRESET_ASSETS));
  }, [allAssets]);

  useEffect(() => {
    if (untrustedAssets.status === ActionStatus.SUCCESS) {
      onClose();
    }

    if (untrustedAssets.errorString) {
      setErrorMessage(untrustedAssets.errorString);
    }
  }, [onClose, untrustedAssets.errorString, untrustedAssets.status]);

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

        const asset = await getValidatedAsset({
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

  return (
    <AddPresetAssetModal
      presetAssets={presetAssets}
      errorMessage={errorMessage}
      isLoading={isPending}
      onConfirm={handleAddUntrustedAssets}
    />
  );
};
