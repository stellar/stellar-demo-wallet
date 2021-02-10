import { TextLink, TextLinkVariant } from "@stellar/design-system";

export const Footer = () => (
  <div className="Footer">
    <div className="Inset">
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
  </div>
);
