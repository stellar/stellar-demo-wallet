import { useState } from "react";
import {
  AnyObject,
  PresetAsset,
  SearchParams,
} from "../types/types";
import { useNavigate } from "react-router-dom";
import {
  getValidatedAsset
} from "demo-wallet-shared/build/helpers/getValidatedAsset";
import {
  getNetworkConfig
} from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import {
  getErrorMessage
} from "demo-wallet-shared/build/helpers/getErrorMessage";
import { log } from "demo-wallet-shared/build/helpers/log";
import {
  getPresetAssets
} from "demo-wallet-shared/build/helpers/getPresetAssets";
import {
  PRESET_CONTRACT_ASSETS,
} from "demo-wallet-shared/build/constants/presetAssets";
import { useRedux } from "../hooks/useRedux";
import { AddPresetAssetModal } from "./AddPresetAssetModal";

export const AddPresetContractAsset = ({ onClose }: { onClose: () => void }) => {
  const { contractAssets } = useRedux("contractAssets");
  // const [presetAssets, setPresetAssets] = useState<PresetAsset[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const onConfirm = async (assetList: PresetAsset[]) => {
    setErrorMessage("");
    setIsValidating(true);

    try {
      const params: {
        assets: string[];
        assetOverrides: AnyObject[];
      } = {
        assets: [],
        assetOverrides: [],
      };

      for (let i = 0; i < assetList.length; i++) {
        const { assetCode, homeDomain, issuerPublicKey } = assetList[i];

        if (!(homeDomain || issuerPublicKey)) {
          const errorMsg = `Home domain OR issuer public key is required with asset code ${assetCode}`;
          throw new Error(errorMsg);
        }

        const asset = await getValidatedAsset({
          assetCode,
          homeDomain,
          issuerPublicKey,
          networkUrl: getNetworkConfig().url,
        });

        const itemId = `${asset.assetCode}:${asset.assetIssuer}`;
        params.assets.push(itemId);

        // Home domain override
        if (asset.homeDomain) {
          params.assetOverrides.push({
            itemId,
            keyPairs: { homeDomain: asset.homeDomain },
          });
        }
      }

      let search = searchParam.update(
        SearchParams.CONTRACT_ASSETS,
        params.assets.join(","),
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
    onClose()
  };

  return (
    <AddPresetAssetModal
      presetAssets={getPresetAssets(contractAssets.data, PRESET_CONTRACT_ASSETS)}
      errorMessage={errorMessage}
      isLoading={isValidating}
      onConfirm={onConfirm}
    />
  );
}