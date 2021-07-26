import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { TextLink } from "@stellar/design-system";

export const CopyWithText = ({
  textToCopy,
  children,
}: {
  textToCopy: string;
  children?: React.ReactNode;
}) => {
  const [inProgress, setInProgress] = useState(false);

  const handleCopy = () => {
    if (inProgress) {
      return;
    }

    setInProgress(true);

    const t = setTimeout(() => {
      setInProgress(false);
      clearTimeout(t);
    }, 1000);
  };

  return (
    <>
      {children}
      <CopyToClipboard text={textToCopy} onCopy={handleCopy}>
        <TextLink role="button">{inProgress ? "Copied" : "Copy"}</TextLink>
      </CopyToClipboard>
    </>
  );
};
