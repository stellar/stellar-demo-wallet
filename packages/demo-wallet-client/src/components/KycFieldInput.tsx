import { Input, Select } from "@stellar/design-system";

type KycFieldType = "string" | "binary" | "number" | "date";

export type KycField = {
  type: KycFieldType;
  description: string;
  optional?: boolean;
  choices?: string[];
};

type KycFieldInputProps = {
  id: string;
  input: KycField;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  isRequired?: boolean;
};

const getInputType = (type: KycFieldType) => {
  switch (type) {
    case "binary":
      return "file";
    case "date":
      return "date";
    case "number":
      return "number";
    case "string":
    default:
      return "text";
  }
};

export const KycFieldInput = ({
  id,
  input,
  onChange,
  isRequired,
}: KycFieldInputProps) => {
  // isRequired param allows to override optional setting returned from the API
  const _isRequired = isRequired || !input.optional;
  const label = `${input.description}${_isRequired ? "" : " (optional)"}`;

  if (input.choices?.length) {
    return (
      <Select
        key={id}
        id={id}
        label={label}
        required={_isRequired}
        onChange={onChange}
      >
        <option></option>
        {input.choices.map((val) => (
          <option value={val}>{val}</option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      key={id}
      id={id}
      label={label}
      required={!input.optional}
      onChange={onChange}
      type={getInputType(input.type)}
    />
  );
};
