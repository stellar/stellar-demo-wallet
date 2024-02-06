import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Loader,
  TextLink,
  Modal,
  Icon,
  IconButton,
} from "@stellar/design-system";

import { ConfirmAssetAction } from "components/ConfirmAssetAction";
import { HomeDomainOverrideModal } from "components/HomeDomainOverrideModal";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import {
  setActiveAssetAction,
  resetActiveAssetAction,
} from "ducks/activeAsset";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { ActionStatus, Asset, SearchParams } from "types/types";
import { useRedux } from "hooks/useRedux";

export const HomeDomainOverrideButtons = ({ asset }: { asset: Asset }) => {
  const [activeModal, setActiveModal] = useState("");

  const { assetOverrides } = useRedux("assetOverrides");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  enum ModalType {
    REMOVE_ASSET_OVERRIDE = "REMOVE_ASSET_OVERRIDE",
    ASSET_OVERRIDE = "ASSET_OVERRIDE",
  }

  const showModal = (modalType: ModalType) => {
    setActiveModal(modalType);

    let activeAsset;

    switch (modalType) {
      case ModalType.ASSET_OVERRIDE:
        // Modal text is set in HomeDomainOverrideModal component
        activeAsset = {
          assetString: asset.assetString,
          title: "",
          callback: () => {
            // do nothing
          },
        };
        break;
      case ModalType.REMOVE_ASSET_OVERRIDE:
        activeAsset = {
          assetString: asset.assetString,
          title: `Remove ${asset.assetCode} home domain override`,
          description: `Asset ${asset.assetCode}’s home domain ${asset.homeDomain} override will be removed. Original home domain will be used, if it exists.`,
          callback: handleRemove,
        };
        break;
      default:
      // do nothing
    }

    dispatch(setActiveAssetAction(activeAsset));
  };

  const handleRemove = () => {
    navigate(
      searchParam.removeKeyPair({
        param: SearchParams.ASSET_OVERRIDES,
        itemId: asset.assetString,
      }),
    );
    log.instruction({
      title: `Asset’s ${asset.assetCode} home domain override \`${asset.homeDomain}\` removed`,
    });
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setActiveModal("");
    dispatch(resetActiveAssetAction());
  };

  if (assetOverrides.status === ActionStatus.PENDING) {
    return <Loader />;
  }

  return (
    <>
      {asset.homeDomain ? (
        <IconButton
          icon={<Icon.Edit2 />}
          altText="Edit home domain"
          onClick={() => showModal(ModalType.ASSET_OVERRIDE)}
        />
      ) : (
        <TextLink onClick={() => showModal(ModalType.ASSET_OVERRIDE)}>
          Add home domain
        </TextLink>
      )}

      {asset.isOverride && (
        <IconButton
          icon={<Icon.XCircle />}
          altText="Remove home domain override"
          onClick={() => showModal(ModalType.REMOVE_ASSET_OVERRIDE)}
          variant={IconButton.variant.error}
        />
      )}

      <Modal
        visible={Boolean(activeModal)}
        onClose={handleCloseModal}
        parentId={CSS_MODAL_PARENT_ID}
      >
        {/* Action confirmation */}
        {activeModal === ModalType.REMOVE_ASSET_OVERRIDE && (
          <ConfirmAssetAction onClose={handleCloseModal} />
        )}

        {/* Override home domain */}
        {activeModal === ModalType.ASSET_OVERRIDE && (
          <HomeDomainOverrideModal asset={asset} onClose={handleCloseModal} />
        )}
      </Modal>
    </>
  );
};
