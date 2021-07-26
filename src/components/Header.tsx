import { useState } from "react";
import { Layout } from "@stellar/design-system";
import { Modal } from "components/Modal";
import { SignOutModal } from "components/SignOutModal";
import { useRedux } from "hooks/useRedux";

export const Header = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const { account } = useRedux("account");

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <Layout.Header
        projectTitle="Demo Wallet"
        onSignOut={
          account.isAuthenticated ? () => setModalVisible(true) : undefined
        }
        hasDarkModeToggle
      />

      <Modal visible={modalVisible} onClose={handleCloseModal}>
        <SignOutModal onClose={handleCloseModal} />
      </Modal>
    </>
  );
};
