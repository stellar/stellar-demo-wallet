import { useState } from "react";
import { TextLink, Layout, Modal } from "@stellar/design-system";
import { ConfigurationModal } from "components/ConfigurationModal";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { useRedux } from "hooks/useRedux";

export const Footer = () => {
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const { account } = useRedux("account");

  const handleConfigModalClose = () => {
    setConfigModalVisible(false);
  };

  return (
    <>
      <Layout.Footer
        gitHubLink="https://github.com/stellar/stellar-demo-wallet"
        hideTopBorder
      >
        {account.isAuthenticated && (
          <div>
            <TextLink onClick={() => setConfigModalVisible(true)}>
              Configuration
            </TextLink>
          </div>
        )}
      </Layout.Footer>

      <Modal
        visible={configModalVisible}
        onClose={handleConfigModalClose}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <ConfigurationModal onClose={handleConfigModalClose} />
      </Modal>
    </>
  );
};
