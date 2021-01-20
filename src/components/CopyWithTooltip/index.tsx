// TODO: move to SDS
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";

import "./styles.scss";

export enum TooltipPosition {
  bottom = "bottom",
  right = "right",
}

interface CopyWithTooltipProps {
  copyText: string;
  tooltipLabel?: string;
  tooltipPosition?: TooltipPosition;
  children: React.ReactNode;
}

export const CopyWithTooltip = ({
  copyText,
  tooltipLabel = "Copied",
  tooltipPosition = TooltipPosition.bottom,
  children,
}: CopyWithTooltipProps) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleCopyDone = () => {
    if (isTooltipVisible) {
      return;
    }

    setIsTooltipVisible(true);

    const t = setTimeout(() => {
      setIsTooltipVisible(false);
      clearTimeout(t);
    }, 1000);
  };

  return (
    <CopyToClipboard text={copyText} onCopy={handleCopyDone}>
      <div className="CopyWithTooltip">
        {children}
        <div
          className="Tooltip"
          data-visible={isTooltipVisible}
          data-position={tooltipPosition}
        >
          {tooltipLabel}
        </div>
      </div>
    </CopyToClipboard>
  );
};
