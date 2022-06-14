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

  const handleUpdateValue = ({
    id,
    value,
    category = "sep9Fields",
  }: {
    id: string;
    value: string;
    category?: string;
  }) => {
    if (value) {
      dispatch(
        updateExtraAction({
          category,
          param: id,
          value: value.toString(),
        }),
      );
    }
  };

  return (
    <div className="FormContainer">
      <Input
        id="memo"
        label="memo"
        type="text"
        onBlur={(e) =>
          handleUpdateValue({
            id: e.target.id,
            value: e.target.value,
            category: "memo",
          })
        }
      />

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
          onBlur={(e) =>
            handleUpdateValue({ id: e.target.id, value: e.target.value })
          }
        />
      ))}
    </div>
  );
};
