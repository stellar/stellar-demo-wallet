import React, { useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Layout } from "@stellar/design-system";
import "./styles.scss";

interface ToastBannerProps {
  parentId: string;
  visible: boolean;
  children: React.ReactNode;
}

export const ToastBanner = ({
  parentId,
  visible,
  children,
}: ToastBannerProps) => {
  const parent = document.getElementById(parentId);
  const [isVisible, setIsVisible] = useState(visible);
  const [isFadeReady, setIsFadeReady] = useState(false);

  useLayoutEffect(() => {
    if (visible) {
      setIsVisible(true);

      setTimeout(() => {
        setIsFadeReady(true);
      }, 150);
    } else {
      // Add a slight delay when closing for better UX
      const t = setTimeout(() => {
        setIsFadeReady(false);
        clearTimeout(t);

        setTimeout(() => {
          setIsVisible(false);
        }, 400);
      }, 600);
    }
  }, [visible]);

  if (!parent || !isVisible) {
    return null;
  }

  return (
    <>
      {ReactDOM.createPortal(
        <div className={`ToastBanner ${isFadeReady ? "open" : ""}`}>
          <Layout.Inset>{children}</Layout.Inset>
        </div>,
        parent,
      )}
    </>
  );
};
