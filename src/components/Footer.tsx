import { useState } from "react";
import { TextLink, Layout } from "@stellar/design-system";
import { Modal } from "components/Modal";
import { ConfigurationModal } from "components/ConfigurationModal";
import { useRedux } from "hooks/useRedux";

export const Footer = () => {
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const { account } = useRedux("account");

  const handleConfigModalClose = () => {
    setConfigModalVisible(false);
  };

  return (
    <>
      <Layout.Footer gitHubLink="https://github.com/stellar/stellar-demo-wallet">
        {account.isAuthenticated && (
          <div>
            <TextLink onClick={() => setConfigModalVisible(true)}>
              Configuration
            </TextLink>
          </div>
        )}
      </Layout.Footer>

      {/* <div className="Footer">
        <div className="Inset">
          <div>
            <TextLink
              variant={TextLink.variant.secondary}
              href="https://www.stellar.org/terms-of-service"
              rel="noreferrer"
              target="_blank"
            >
              Terms of Service
            </TextLink>
            <TextLink
              variant={TextLink.variant.secondary}
              href="https://www.stellar.org/privacy-policy"
              rel="noreferrer"
              target="_blank"
            >
              Privacy Policy
            </TextLink>

            <TextLink
              variant={TextLink.variant.secondary}
              href="https://github.com/stellar/stellar-demo-wallet"
              rel="noreferrer"
              target="_blank"
              title="Check out our GitHub repo for more information and to
              // log issues"
            >
              GitHub
            </TextLink>
          </div>

          {account.isAuthenticated && (
            <div>
              <TextLink onClick={() => setConfigModalVisible(true)}>
                Configuration
              </TextLink>
            </div>
          )}
        </div>
      </div> */}

      <Modal visible={configModalVisible} onClose={handleConfigModalClose}>
        <ConfigurationModal onClose={handleConfigModalClose} />
      </Modal>
    </>
  );
};
