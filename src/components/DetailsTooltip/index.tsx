// TODO: move to SDS
import { useRef, useState, useLayoutEffect } from "react";
import { IconButton, Icon } from "@stellar/design-system";
import { Tooltip } from "components/Tooltip";

import "./styles.scss";

enum TooltipPosition {
  left = "left",
  right = "right",
}

interface DetailsTooltipComponent {
  tooltipPosition: typeof TooltipPosition;
}

interface DetailsTooltipProps {
  details: React.ReactNode;
  children: React.ReactElement;
  isInline?: boolean;
  altText?: string;
  tooltipPosition?: TooltipPosition;
  customIcon?: React.ReactNode;
  customColor?: string;
  customSize?: string;
}

export const DetailsTooltip: React.FC<DetailsTooltipProps> &
  DetailsTooltipComponent = ({
  details,
  children,
  isInline,
  altText = "Learn more",
  tooltipPosition = TooltipPosition.right,
  customIcon = <Icon.Info />,
  customColor,
  customSize,
}) => {
  const toggleEl = useRef<null | HTMLDivElement>(null);
  const tooltipEl = useRef<null | HTMLDivElement>(null);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  useLayoutEffect(() => {
    if (isTooltipVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTooltipVisible]);

  const handleClickOutside = (event: MouseEvent) => {
    // Do nothing if clicking tooltip itself or link inside the tooltip
    if (
      event.target === tooltipEl?.current ||
      tooltipEl?.current?.contains(event.target as Node)
    ) {
      return;
    }

    if (!toggleEl?.current?.contains(event.target as Node)) {
      setIsTooltipVisible(false);
    }
  };

  const getExtraClasses = () => {
    const classes: string[] = [];

    if (isInline) {
      classes.push("DetailsTooltip--inline");
    }

    if (isTooltipVisible) {
      classes.push("DetailsTooltip--open");
    }

    return classes.join(" ");
  };

  return (
    <div className={`DetailsTooltip ${getExtraClasses()}`}>
      <div className="DetailsTooltip__component">{children}</div>
      <div
        ref={toggleEl}
        className={`DetailsTooltip__button DetailsTooltip--${tooltipPosition}`}
      >
        <IconButton
          altText={altText}
          icon={customIcon}
          customSize={customSize}
          customColor={customColor}
          onClick={() => setIsTooltipVisible(!isTooltipVisible)}
        />

        <div ref={tooltipEl} className="DetailsTooltip__tooltipWrapper">
          <Tooltip isVisible={isTooltipVisible}>{details}</Tooltip>
        </div>
      </div>
    </div>
  );
};

DetailsTooltip.displayName = "DetailsTooltip";
DetailsTooltip.tooltipPosition = TooltipPosition;
