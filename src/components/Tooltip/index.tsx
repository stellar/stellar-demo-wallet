// TODO: move to SDS
import React, { forwardRef } from "react";
import "./styles.scss";

interface TooltipProps {
  isVisible: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (props, ref) => {
    const { isVisible, children, className } = props;

    return (
      <div
        className={`Tooltip ${className ?? ""}`}
        style={{ visibility: isVisible ? "visible" : "hidden" }}
        ref={ref}
      >
        <div className="Tooltip__content">{children}</div>
      </div>
    );
  },
);
