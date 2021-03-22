import { TextLink, TextLinkVariant } from "components/TextLink";

export const Footer = () => (
  <div className="Footer">
    <div className="Inset">
      <TextLink
        variant={TextLinkVariant.secondary}
        href="https://www.stellar.org/terms-of-service"
        isExternal
      >
        Terms of Service
      </TextLink>
      <TextLink
        variant={TextLinkVariant.secondary}
        href="https://www.stellar.org/privacy-policy"
        isExternal
      >
        Privacy Policy
      </TextLink>
    </div>
  </div>
);
