import { useState } from "react";
import { TextLink, Layout, Modal } from "@stellar/design-system";
import { ConfigurationModal } from "components/ConfigurationModal";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { useRedux } from "hooks/useRedux";
import { gitInfo } from "../generated/gitInfo";

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
        {gitInfo?.commitHash ? (
          <div className="Footer__commitHash">{`Commit hash: ${gitInfo.commitHash}`}</div>
        ) : null}
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
