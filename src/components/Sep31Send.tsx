import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Heading2, Heading3, Input } from "@stellar/design-system";
import { fetchAccountAction } from "ducks/account";
import {
  resetSendSep31Action,
  submitSendSep31TransactionAction,
} from "ducks/sendSep31";
import { capitalizeString } from "helpers/capitalizeString";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep31Send = () => {
  const { account, sendSep31 } = useRedux("account", "sendSep31");
  const [formData, setFormData] = useState<any>({});

  const dispatch = useDispatch();

  useEffect(() => {
    if (sendSep31.status === ActionStatus.SUCCESS) {
      if (account.data?.id) {
        dispatch(
          fetchAccountAction({
            publicKey: account.data.id,
            secretKey: account.secretKey,
          }),
        );
        dispatch(resetSendSep31Action());
      }
    }
  }, [sendSep31.status, account.data?.id, account.secretKey, dispatch]);

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
    dispatch(submitSendSep31TransactionAction({ ...formData }));
  };

  const renderInfoInputs = () => {
    const { data } = sendSep31;
    const { transaction, sender, receiver } = data.fields;

    const allFields = {
      amount: {
        amount: {
          description: "amount to send",
        },
      },
      sender,
      receiver,
      transaction,
    };

    return (
      <>
        <Heading2>Collect Info</Heading2>
        <div className="SendForm Block">
          {Object.entries(allFields).map(([sectionTitle, sectionItems]) => (
            <div key={sectionTitle}>
              <Heading3>{capitalizeString(sectionTitle)}</Heading3>
              {Object.entries(sectionItems).map(([id, input]) => (
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
