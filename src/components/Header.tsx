import { useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Button,
  ButtonVariant,
  ProjectLogo,
  TextButton,
} from "@stellar/design-system";
import { resetStoreAction } from "config/store";
import { Modal } from "components/Modal";
import { useRedux } from "hooks/useRedux";

export const Header = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const { account } = useRedux("account");
  const dispatch = useDispatch();
  const history = useHistory();

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const handleSignOut = () => {
    dispatch(resetStoreAction());
    history.push({
      pathname: "/",
    });
    handleCloseModal();
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
        <div className="ModalBody">
          <p>
            You can reload the account using your secret key or press back in
            your browser to sign back in.
          </p>
        </div>

        <div className="ModalButtonsFooter">
          <Button onClick={handleSignOut}>Sign out</Button>
          <Button variant={ButtonVariant.secondary} onClick={handleCloseModal}>
            Go back
          </Button>
        </div>
      </Modal>
    </div>
  );
};
