import React from "react";
import "./styles.scss";

export const Banner = ({ children }: { children: React.ReactNode }) => (
  <div className="Banner">
    <div className="Inset">{children}</div>
  </div>
);
