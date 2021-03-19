import { useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { TextLink } from "@stellar/design-system";
import { ConfirmAssetAction } from "components/ConfirmAssetAction";
import { HomeDomainOverrideModal } from "components/HomeDomainOverrideModal";
import { Modal } from "components/Modal";
import { IconButton } from "components/IconButton";
import {
  setActiveAssetAction,
  resetActiveAssetAction,
} from "ducks/activeAsset";
import { searchParam } from "helpers/searchParam";
import { Asset, SearchParams } from "types/types.d";

import { ReactComponent as IconEdit } from "assets/icons/edit.svg";
import { ReactComponent as IconRemove } from "assets/icons/error.svg";

export const HomeDomainOverrideButtons = ({ asset }: { asset: Asset }) => {
  const [activeModal, setActiveModal] = useState("");

  const dispatch = useDispatch();
  const history = useHistory();

  enum ModalType {
    CONFIRM_ACTION = "CONFIRM_ACTION",
    ASSET_OVERRIDE = "ASSET_OVERRIDE",
  }

  const showModal = (modalType: ModalType) => {
    setActiveModal(modalType);

    let activeAsset;

    switch (modalType) {
      case ModalType.ASSET_OVERRIDE:
        activeAsset = {
          assetString: asset.assetString,
          title: "",
          callback: () => {},
        };
        break;
      case ModalType.CONFIRM_ACTION:
        activeAsset = {
          assetString: asset.assetString,
          title: `Remove ${asset.assetCode} asset override`,
          description: `Home domain will be remove`,
          callback: handleRemove,
        };
        break;
      default:
      // do nothing
    }

    dispatch(setActiveAssetAction(activeAsset));
  };

  const handleRemove = () => {
    history.push(
      searchParam.removeKeyPair({
        searchParam: SearchParams.ASSET_OVERRIDES,
        itemId: asset.assetString,
      }),
    );
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setActiveModal("");
    dispatch(resetActiveAssetAction());
  };

  return (
    <>
      {asset.homeDomain ? (
        <IconButton
          icon={<IconEdit />}
          altText="Edit home domain"
          onClick={() => showModal(ModalType.ASSET_OVERRIDE)}
        />
      ) : (
        <TextLink
          onClick={() => showModal(ModalType.ASSET_OVERRIDE)}
          target="_blank"
        >
          Add home domain
        </TextLink>
      )}

      {asset.isOverride && (
        <IconButton
          icon={<IconRemove />}
          altText="Remove home domain override"
          onClick={() => showModal(ModalType.CONFIRM_ACTION)}
          color="var(--color-error)"
        />
      )}

      <Modal visible={Boolean(activeModal)} onClose={handleCloseModal}>
        {/* Action confirmation */}
        {activeModal === ModalType.CONFIRM_ACTION && (
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
