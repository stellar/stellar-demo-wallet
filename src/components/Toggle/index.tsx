import React, { useEffect, useState } from "react";
import "./styles.scss";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  checked: boolean;
  onChange: () => void;
}

export const Toggle = ({ id, checked, onChange }: ToggleProps) => {
  const [checkedValue, setCheckedValue] = useState(checked);

  useEffect(() => {
    setCheckedValue(checked);
  }, [checked]);

  return (
    <label className="ToggleWrapper" htmlFor={id}>
      <input
        className="ToggleInput"
        type="checkbox"
        name={id}
        id={id}
        checked={checkedValue}
        onChange={onChange}
      />
      <div className="Toggle" />
    </label>
  );
};
