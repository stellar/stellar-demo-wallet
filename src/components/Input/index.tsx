import React from "react";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";
import "./styles.scss";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  rightElement?: string;
  note?: React.ReactNode;
  error?: string;
  tooltipText?: string | React.ReactNode;
}

export const Input = ({
  id,
  label,
  rightElement,
  note,
  error,
  tooltipText,
  ...props
}: InputProps) => (
  <div className="Input">
    {label && (
      <div className="InputLabelWrapper">
        <label htmlFor={id}>{label}</label>
        {tooltipText && (
          <InfoButtonWithTooltip>{tooltipText}</InfoButtonWithTooltip>
        )}
      </div>
    )}
    <div className="InputContainer">
      <div className="InputWrapper" data-disabled={props.disabled}>
        <input id={id} aria-invalid={!!error} {...props} />
      </div>
      {rightElement && <div className="InputRightElement">{rightElement}</div>}
    </div>
    {error && <div className="InputError">{error}</div>}
    {note && <div className="InputNote">{note}</div>}
  </div>
);
