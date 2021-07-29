import React from "react";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";
import "./styles.scss";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: string;
  tooltipText?: string | React.ReactNode;
}

const getHeadingComponent = (Component: string): React.FC<HeadingProps> => ({
  children,
  tooltipText,
  ...props
}) => (
  <Component {...props}>
    {children}
    {tooltipText && (
      <InfoButtonWithTooltip>{tooltipText}</InfoButtonWithTooltip>
    )}
  </Component>
);

export const Heading1 = getHeadingComponent("h1");
export const Heading2 = getHeadingComponent("h2");
export const Heading3 = getHeadingComponent("h3");
export const Heading4 = getHeadingComponent("h4");
export const Heading5 = getHeadingComponent("h5");
