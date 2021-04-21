import React from "react";
import "./styles.scss";

export enum TextLinkVariant {
  primary = "primary",
  secondary = "secondary",
}

interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: string;
  variant?: TextLinkVariant;
  isExternal?: boolean;
}

export const TextLink: React.FC<TextLinkProps> = ({
  variant = TextLinkVariant.primary,
  children,
  isExternal,
  ...props
}) => (
  <a
    className="TextLink"
    data-variant={variant}
    {...(isExternal ? { rel: "noreferrer noopener", target: "_blank" } : {})}
    {...props}
  >
    {children}
  </a>
);
