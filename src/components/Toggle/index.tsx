import React from "react";
import "./styles.scss";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  // onChange: () => void
}

export const Toggle = ({ id }: ToggleProps) => (
  <label className="ToggleWrapper" htmlFor={id}>
    <input className="ToggleInput" type="checkbox" id={id} />
    <div className="Toggle" />
  </label>
);
