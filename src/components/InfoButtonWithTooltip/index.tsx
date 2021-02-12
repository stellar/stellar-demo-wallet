import React, { useState, useEffect, useRef } from "react";
import { IconInfo } from "@stellar/design-system";
import "./styles.scss";

export const InfoButtonWithTooltip = ({
  children,
}: {
  children: string | React.ReactNode;
}) => {
  const toggleEl = useRef<null | HTMLDivElement>(null);
  const infoEl = useRef<null | HTMLDivElement>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  useEffect(() => {
    if (isInfoVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInfoVisible]);

  const handleClickOutside = (event: MouseEvent) => {
    // Do nothing if clicking tooltip itself or link inside the tooltip
    if (
      event.target === infoEl?.current ||
      infoEl?.current?.contains(event.target as Node)
    ) {
      return;
    }

    if (!toggleEl?.current?.contains(event.target as Node)) {
      setIsInfoVisible(false);
    }
  };

  return (
    <>
      <div
        className="InfoButton"
        ref={toggleEl}
        onClick={() => setIsInfoVisible((currentState) => !currentState)}
      >
        <IconInfo />
      </div>

      <div
        className="Tooltip InfoButtonTooltip"
        ref={infoEl}
        data-hidden={!isInfoVisible}
      >
        {children}
      </div>
    </>
  );
};
