import { useRef, useState, useLayoutEffect } from "react";
import { IconButton, Icon } from "@stellar/design-system";
import { Tooltip } from "components/Tooltip";

import "./styles.scss";

interface DetailsTooltipProps {
  details: React.ReactNode;
  children: React.ReactElement;
  altText?: string;
  customIcon?: React.ReactNode;
  customColor?: string;
  customSize?: string;
}

export const DetailsTooltip = ({
  details,
  children,
  altText = "Learn more",
  customIcon = <Icon.Info />,
  customColor,
  customSize,
}: DetailsTooltipProps) => {
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

  return (
    <div
      className={`DetailsTooltip ${
        isTooltipVisible ? "DetailsTooltip--open" : ""
      }`}
    >
      <div className="DetailsTooltip__component">{children}</div>
      <div ref={toggleEl} className="DetailsTooltip__button">
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
