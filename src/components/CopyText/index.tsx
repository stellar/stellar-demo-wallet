// TODO: move to SDS
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { Icon } from "@stellar/design-system";
import { Tooltip } from "components/Tooltip";
import "./styles.scss";

enum TooltipPosition {
  bottom = "bottom",
  right = "right",
}

interface CopyTextComponent {
  tooltipPosition: typeof TooltipPosition;
}

interface CopyTextProps {
  copyText: string;
  showCopyIcon?: boolean;
  showTooltip?: boolean;
  doneLabel?: string;
  tooltipPosition?: TooltipPosition;
  children: React.ReactElement | string;
}

export const CopyText: React.FC<CopyTextProps> & CopyTextComponent = ({
  copyText,
  showCopyIcon,
  showTooltip,
  doneLabel = "Copied",
  tooltipPosition = TooltipPosition.bottom,
  children,
}) => {
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

  const renderElement = (element: React.ReactElement | string) => {
    const label = !showTooltip && isTooltipVisible ? doneLabel : null;

    if (typeof element === "string") {
      return label ?? element;
    }

    return (
      <element.type {...element.props}>
        {label ?? element.props.children}
      </element.type>
    );
  };

  return (
    <div className="CopyText">
      <CopyToClipboard text={copyText} onCopy={handleCopyDone}>
        <div title="Copy" role="button" className="CopyText__content">
          {renderElement(children)}

          {showCopyIcon ? (
            <div className="CopyText__content__copy-icon">
              <Icon.Copy />
            </div>
          ) : null}
        </div>
      </CopyToClipboard>

      {showTooltip ? (
        <Tooltip
          className={`CopyText__tooltip CopyText__tooltip--${tooltipPosition}`}
          isVisible={isTooltipVisible}
        >
          {doneLabel}
        </Tooltip>
      ) : null}
    </div>
  );
};

CopyText.displayName = "CopyText";
CopyText.tooltipPosition = TooltipPosition;
