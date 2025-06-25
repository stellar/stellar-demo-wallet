import { useEffect, useState } from "react";
import {
  Button,
  Heading2,
  Layout,
  Modal,
  TextLink,
} from "@stellar/design-system";
import { useRedux } from "../hooks/useRedux";
import { BalanceRow } from "./BalanceRow";
import { AddContractAsset } from "./AddContractAsset";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { AppDispatch } from "../config/store";
import { useDispatch } from "react-redux";
import {
  fetchContractAssetsAction,
  removeContractAssetAction,
  resetContractAssetsAction,
} from "../ducks/contractAssets";
import { ActionStatus, Asset, SearchParams } from "../types/types";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { log } from "demo-wallet-shared/build/helpers/log";
import { useNavigate } from "react-router-dom";

export const ContractAccountAssets = () => {
  const { contractAccount, contractAssets, settings} = useRedux("contractAccount", "contractAssets", "settings");
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Only proceed if contract account is successfully fetched
    if (contractAccount.status !== ActionStatus.SUCCESS || !contractAccount.contractId) {
      return;
    }

    if (!settings.contractAssets) {
      // Clear the store when no assets in URL
      dispatch(resetContractAssetsAction());
      return;
    }

    // Always fetch fresh data from URL
    dispatch(fetchContractAssetsAction({
      assetsString: settings.contractAssets,
      contractId: contractAccount.contractId,
      assetOverridesString: settings.assetOverrides || undefined,
    }));
  }, [settings.contractAssets, settings.assetOverrides, contractAccount.contractId, dispatch, contractAccount.status]);

  const [activeModal, setActiveModal] = useState("");
  enum ModalType {
    ADD_ASSET = "ADD_ASSET",
  }

  const handleCloseModal = () => {
    setActiveModal("");
  };

  const handleRemoveAsset = (asset: Asset) => {
    const { assetString } = asset;

    let search= searchParam.remove(SearchParams.CONTRACT_ASSETS, assetString);
    search = searchParam.removeKeyPair({
      param: SearchParams.ASSET_OVERRIDES,
      itemId: asset.assetString,
      urlSearchParams: new URLSearchParams(search)
    });
    
    navigate(search);
    dispatch(removeContractAssetAction(assetString));
    log.instruction({ title: `Asset \`${assetString}\` removed` });
  };

  return (
    <>
      <div className="Section">
        <Layout.Inset>
          <Heading2>Balances</Heading2>
        </Layout.Inset>
        <div className="Balances">
          {contractAssets.data.map((asset) => (
            <BalanceRow
              activeAction={undefined}
              key={asset.assetString}
              asset={asset}
              onAction={() => {}}
            >
              <TextLink
                onClick={() => handleRemoveAsset(asset)}
              >
                Remove
              </TextLink>
            </BalanceRow>
          ))}
        </div>
        <Layout.Inset>
          <div className="BalancesButtons">
            <Button 
              onClick={() => setActiveModal(ModalType.ADD_ASSET)} 
              disabled={false}
            >
              Add asset
            </Button>
          </div>
        </Layout.Inset>
      </div>

      <Modal
        visible={Boolean(activeModal)}
        onClose={handleCloseModal}
        parentId={CSS_MODAL_PARENT_ID}
      >
        {activeModal === ModalType.ADD_ASSET && (
          <AddContractAsset onClose={handleCloseModal} />
        )}
      </Modal>
    </>
  );
};