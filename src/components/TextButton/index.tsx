import React from "react";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";
import "./styles.scss";

export enum TextButtonVariant {
  primary = "primary",
  secondary = "secondary",
}

interface TextButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: TextButtonVariant;
  tooltipText?: string | React.ReactNode;
  children: string;
}

export const TextButton: React.FC<TextButtonProps> = ({
  icon,
  variant = TextButtonVariant.primary,
  tooltipText,
  children,
  ...props
}) => (
  <div className="TextButtonWrapper">
    <button className="TextButton" data-variant={variant} {...props}>
      {icon && <span className="TextButtonIcon">{icon}</span>}
      {children}
    </button>
    {tooltipText && (
      <InfoButtonWithTooltip>{tooltipText}</InfoButtonWithTooltip>
    )}
  </div>
);
