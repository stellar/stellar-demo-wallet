import { Input } from "@stellar/design-system";

type KycFieldType = "string" | "binary" | "number" | "date";

export type KycField = {
  type: KycFieldType;
  description: string;
  optional?: boolean;
};

type KycFieldInputProps = {
  id: string;
  input: KycField;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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

export const KycFieldInput = ({ id, input, onChange }: KycFieldInputProps) => {
  const label = `${input.description}${input.optional ? " (optional)" : ""}`;

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
