import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { IconClose } from "@stellar/design-system";

import "./styles.scss";

const MODAL_OPEN_CLASS_NAME = "modal-open";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  disableWindowScrollWhenOpened?: boolean;
}

export const Modal = ({
  visible,
  onClose,
  disableWindowScrollWhenOpened = false,
  children,
}: ModalProps) => {
  const parent = document.getElementById("app-wrapper");

  useEffect(() => {
    if (disableWindowScrollWhenOpened && visible) {
      document.body.classList.add(MODAL_OPEN_CLASS_NAME);
    } else {
      document.body.classList.remove(MODAL_OPEN_CLASS_NAME);
    }
  }, [disableWindowScrollWhenOpened, visible]);

  if (!parent || !visible) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className="ModalWrapper">
      <div className="Modal">
        <div className="ModalContent">{children}</div>
        <button className="ModalCloseButton" onClick={onClose}>
          <IconClose />
        </button>
      </div>
      <div className="ModalBackground" onClick={onClose} />
    </div>,
    parent,
  );
};
