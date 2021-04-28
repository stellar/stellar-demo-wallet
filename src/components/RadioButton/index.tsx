import React from "react";
import "./styles.scss";

interface RadioButtonProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
}

export const RadioButton = ({ id, label, ...props }: RadioButtonProps) => (
  <div className="RadioButton">
    <input type="radio" id={id} {...props} />
    <label htmlFor={id}>{label}</label>
  </div>
);
