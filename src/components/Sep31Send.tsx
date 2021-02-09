import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Heading2, Heading3, Input } from "@stellar/design-system";
import { submitSendSep31TransactionAction } from "ducks/sendSep31";
import { capitalizeString } from "helpers/capitalizeString";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

interface FormData {
  [key: string]: {
    [key: string]: string;
  };
}

export const Sep31Send = () => {
  const { sendSep31 } = useRedux("sendSep31");
  const [formData, setFormData] = useState<FormData>({});

  const dispatch = useDispatch();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;
    const [section, field] = id.split("#");

    const updatedState = {
      ...formData,
      [section]: {
        ...(formData[section] || {}),
        [field]: value,
      },
    };

    setFormData(updatedState);
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSendSep31TransactionAction({ formData }));
  };

  const renderInfoInputs = () => {
    const { info, sep12Fields } = sendSep31;

    console.log("info?.fields?.transaction: ", info?.fields?.transaction);
    console.log("sep12Fields: ", sep12Fields);

    const allFields = {
      amount: {
        amount: {
          description: "amount to send",
        },
      },
      sender: sep12Fields?.senderSep12Fields,
      receiver: sep12Fields?.receiverSep12Fields,
      transaction: info?.fields?.transaction,
    };

    return (
      <>
        <Heading2>Collect Info</Heading2>
        <div className="SendForm Block">
          {Object.entries(allFields).map(([sectionTitle, sectionItems]) => (
            <div key={sectionTitle}>
              <Heading3>{capitalizeString(sectionTitle)}</Heading3>
              {/* TODO: types */}
              {Object.entries(sectionItems).map(([id, input]: any) => (
                // TODO: if input.choices, render Select
                <Input
                  key={`${sectionTitle}#${id}`}
                  id={`${sectionTitle}#${id}`}
                  label={input.description}
                  required={!input.optional}
                  onChange={handleChange}
                />
              ))}
            </div>
          ))}
        </div>

        <Button onClick={handleSubmit}>Submit</Button>
      </>
    );
  };

  if (sendSep31.status === ActionStatus.NEEDS_INPUT) {
    return renderInfoInputs();
  }

  return null;
};
