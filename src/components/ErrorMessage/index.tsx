// TODO: move to SDS
import React from "react";
import "./styles.scss";

interface ErrorMessageProps {
  message: React.ReactNode | undefined;
  marginTop?: string;
  marginBottom?: string;
  textAlign?: "left" | "center" | "right";
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  marginTop = "0",
  marginBottom = "0",
  textAlign = "left",
}) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className="ErrorMessage"
      style={{ marginTop, marginBottom, textAlign }}
    >
      {message}
    </div>
  );
};
