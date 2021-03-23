import React from "react";
import "./styles.scss";

export const TextCode = ({
  breakAnywhere,
  children,
}: {
  breakAnywhere?: boolean;
  children: string | React.ReactNode;
}) => (
  <span
    className="TextCode"
    style={{ lineBreak: breakAnywhere ? "anywhere" : "auto" }}
  >
    {children}
  </span>
);
