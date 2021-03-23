import { useState } from "react";
import { TextLink, TextLinkVariant, TextButton } from "@stellar/design-system";
import { Modal } from "components/Modal";
import { ConfigurationModal } from "components/ConfigurationModal";

export const Footer = () => {
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const handleConfigModalClose = () => {
    setConfigModalVisible(false);
  };

  return (
    <>
      <div className="Footer">
        <div className="Inset">
          <div>
            <TextLink
              variant={TextLinkVariant.secondary}
              href="https://www.stellar.org/terms-of-service"
              rel="noreferrer"
              target="_blank"
            >
              Terms of Service
            </TextLink>
            <TextLink
              variant={TextLinkVariant.secondary}
              href="https://www.stellar.org/privacy-policy"
              rel="noreferrer"
              target="_blank"
            >
              Privacy Policy
            </TextLink>
          </div>

          <div>
            <TextButton onClick={() => setConfigModalVisible(true)}>
              Configuration
            </TextButton>
          </div>
        </div>
      </div>

      <Modal visible={configModalVisible} onClose={handleConfigModalClose}>
        <ConfigurationModal onClose={handleConfigModalClose} />
      </Modal>
    </>
  );
};
