import { useState } from "react";
import {
  Button,
  Checkbox,
  Heading3,
  Input,
  TextLink,
} from "@stellar/design-system";
import { useDispatch } from "react-redux";
import { updateExtraAction, removeExtraAction } from "ducks/extra";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ExtraCategory } from "types/types";

const FIELDS = [
  {
    id: "amount",
    label: "Amount",
    type: "number",
  },
  {
    id: "first_name",
    label: "First name",
    type: "text",
  },
  {
    id: "last_name",
    label: "Last name",
    type: "text",
  },
  {
    id: "birth_date",
    label: "Birth date",
    type: "text",
  },
  {
    id: "mobile_number",
    label: "Mobile number",
    type: "text",
  },
  {
    id: "email_address",
    label: "Email address",
    type: "email",
  },
  {
    id: "address",
    label: "Address",
    type: "text",
  },
];

export const ExtraSep9Fields = () => {
  const { extra } = useRedux("extra");
  const sep9FieldsWithValue = extra.sep9Fields;

  const [isSep9OptionsVisible, setIsSep9OptionsVisible] = useState(false);
  const [isSep9FieldsVisible, setIsSep9FieldsVisible] = useState(false);
  const [selectedSep9Fields, setSelectedSep9Fields] = useState<string[]>([]);

  const dispatch: AppDispatch = useDispatch();

  const handleUpdateValue = ({
    id,
    value,
    category = "sep9Fields",
  }: {
    id: string;
    value: string;
    category?: ExtraCategory;
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

  const handleSep9OptionChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { id, checked: isChecked } = event.currentTarget;
    let selectedFields = [...selectedSep9Fields];

    if (isChecked) {
      selectedFields.push(id);
    } else {
      selectedFields = selectedFields.filter((f) => f !== id);

      if (sep9FieldsWithValue?.[id]) {
        dispatch(
          updateExtraAction({
            category: "sep9Fields",
            param: id,
            value: "",
          }),
        );
      }
    }

    setSelectedSep9Fields(selectedFields);
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

      <div className="Sep9Fields Block">
        <Heading3>SEP-9 (KYC) fields</Heading3>

        <p>
          Wallets can provide{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md">
            SEP-9 parameters
          </TextLink>{" "}
          in order to make the onboarding experience easier.
        </p>

        <Checkbox
          id="sep9-fields-visible"
          label="Show SEP-9 fields to select"
          onChange={() => {
            setIsSep9OptionsVisible(
              isSep9FieldsVisible ? false : !isSep9OptionsVisible,
            );
            setIsSep9FieldsVisible(false);
            setSelectedSep9Fields([]);

            if (sep9FieldsWithValue) {
              dispatch(removeExtraAction(["sep9Fields"]));
            }
          }}
        />

        {isSep9OptionsVisible ? (
          <>
            <p>Select which fields to fill out and press "Continue".</p>

            <div className="Sep9Fields__inputs">
              {FIELDS.map((f) => (
                <Checkbox
                  name="sep9Options"
                  id={f.id}
                  label={f.label}
                  onChange={handleSep9OptionChange}
                  checked={selectedSep9Fields.includes(f.id)}
                />
              ))}
            </div>

            <Button
              onClick={() => {
                setIsSep9OptionsVisible(false);
                setIsSep9FieldsVisible(true);
              }}
              disabled={!selectedSep9Fields.length}
            >
              Continue
            </Button>
          </>
        ) : null}

        {isSep9FieldsVisible ? (
          <>
            <div className="Sep9Fields__inputs">
              {FIELDS.map((f) => {
                if (selectedSep9Fields.includes(f.id)) {
                  return (
                    <Input
                      id={f.id}
                      label={f.id}
                      type={f.type}
                      onBlur={(e) =>
                        handleUpdateValue({
                          id: e.target.id,
                          value: e.target.value,
                        })
                      }
                      defaultValue={sep9FieldsWithValue?.[f.id] || ""}
                    />
                  );
                }

                return null;
              })}
            </div>
            <Button
              onClick={() => {
                setIsSep9OptionsVisible(true);
                setIsSep9FieldsVisible(false);
              }}
            >
              Back
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};
