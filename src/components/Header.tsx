import { useState } from "react";
import { ProjectLogo, TextButton } from "@stellar/design-system";
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
    <div className="Header">
      <div className="Inset">
        <ProjectLogo title="Demo Wallet" />
        {account.isAuthenticated && (
          <TextButton onClick={() => setModalVisible(true)}>
            Sign out
          </TextButton>
        )}
      </div>

      <Modal visible={modalVisible} onClose={handleCloseModal}>
        <SignOutModal onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};
