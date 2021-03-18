import React from "react";
import "./styles.scss";

type IconButtonProps = {
  icon: React.ReactNode;
  onClick: () => void;
  altText: string;
  color?: string;
};

export const IconButton = ({
  icon,
  onClick,
  altText,
  color,
}: IconButtonProps) => (
  <div
    className="IconButton"
    onClick={onClick}
    title={altText}
    {...(color ? { style: { fill: color } } : {})}
  >
    {icon}
  </div>
);
