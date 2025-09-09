import { useState } from "react";
import { Layout, Modal } from "@stellar/design-system";
import { SignOutModal } from "components/SignOutModal";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { useRedux } from "hooks/useRedux";

export const Header = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const { account, contractAccount } = useRedux("account", "contractAccount");

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Layout.Header
        projectTitle="Demo Wallet"
        {...(account.isAuthenticated || contractAccount.isAuthenticated
          ? { onSignOut: () => setModalVisible(true) }
          : {})}
        hasDarkModeToggle
      />

      <Modal
        visible={modalVisible}
        onClose={handleCloseModal}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <SignOutModal onClose={handleCloseModal} />
      </Modal>
    </>
  );
};
