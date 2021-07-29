// TODO: move to SDS
import React from "react";
import { Layout } from "@stellar/design-system";
import "./styles.scss";

interface BannerProps {
  children: React.ReactNode;
}

export const Banner: React.FC<BannerProps> = ({ children }) => (
  <div className="Banner">
    <Layout.Inset>{children}</Layout.Inset>
  </div>
);
