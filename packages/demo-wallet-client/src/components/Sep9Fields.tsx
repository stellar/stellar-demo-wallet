import { Input, TextLink } from "@stellar/design-system";
import { useDispatch } from "react-redux";
import { updateExtraAction } from "ducks/extra";

export const Sep9Fields = () => {
  const FIELDS = [
    {
      id: "amount",
      type: "number",
    },
    {
      id: "first_name",
      type: "text",
    },
    {
      id: "last_name",
      type: "text",
    },
    {
      id: "birth_date",
      type: "text",
    },
    {
      id: "mobile_number",
      type: "text",
    },
    {
      id: "email_address",
      type: "email",
    },
    {
      id: "address",
      type: "text",
    },
  ];

  const dispatch = useDispatch();

  const handleUpdateValue = (id: string, value: string) => {
    if (value) {
      dispatch(
        updateExtraAction({
          category: "sep9Fields",
          param: id,
          value: value.toString(),
        }),
      );
    }
  };

  return (
    <div className="FormContainer">
      <p>
        Wallets can provide{" "}
        <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md">
          SEP-9 parameters
        </TextLink>{" "}
        in order to make the onboarding experience easier.
      </p>
      {FIELDS.map((f) => (
        <Input
          id={f.id}
          label={f.id}
          type={f.type}
          onBlur={(e) => handleUpdateValue(e.target.id, e.target.value)}
        />
      ))}
    </div>
  );
};
