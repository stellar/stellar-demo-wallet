import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Button, Input } from "@stellar/design-system";
import { Heading2, Heading3 } from "components/Heading";
import { Modal } from "components/Modal";
import { RadioButton } from "components/RadioButton";
import { TextLink } from "components/TextLink";
import { fetchAccountAction } from "ducks/account";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  resetSep31SendAction,
  submitSep31SendTransactionAction,
  setCustomerTypesAction,
  fetchSendFieldsAction,
} from "ducks/sep31Send";
import { capitalizeString } from "helpers/capitalizeString";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

enum CustomerType {
  SENDER = "sender",
  RECEIVER = "receiver",
}

export const Sep31Send = () => {
  const { account, sep31Send } = useRedux("account", "sep31Send");
  const [formData, setFormData] = useState<any>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [customerTypes, setCustomerTypes] = useState<{
    sender: string;
    receiver: string;
  }>({
    sender: "",
    receiver: "",
  });

  const dispatch = useDispatch();

  useEffect(() => {
    if (sep31Send.status === ActionStatus.CAN_PROCEED) {
      if (sep31Send.data.isTypeSelected) {
        dispatch(fetchSendFieldsAction());
      }
    }

    if (sep31Send.status === ActionStatus.SUCCESS) {
      if (account.data?.id) {
        resetLocalState();
        dispatch(
          fetchAccountAction({
            publicKey: account.data.id,
            secretKey: account.secretKey,
          }),
        );
        dispatch(resetSep31SendAction());
      }
    }
  }, [
    sep31Send.status,
    sep31Send.data.isTypeSelected,
    account.data?.id,
    account.secretKey,
    dispatch,
  ]);

  const resetLocalState = () => {
    setErrorMessage("");
    setCustomerTypesAction({ senderType: "", receiverType: "" });
    setFormData({});
  };

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

  const handleTypeChange = (type: CustomerType, typeId: string) => {
    const updatedTypes = {
      ...customerTypes,
      [type]: typeId,
    };

    setCustomerTypes(updatedTypes);
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep31SendTransactionAction({ ...formData }));
  };

  const handleSelectTypes = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    setErrorMessage("");
    const { sender, receiver } = customerTypes;
    event.preventDefault();

    if (!sender || !receiver) {
      setErrorMessage("Sender and receiver types are required");
      return;
    }

    dispatch(
      setCustomerTypesAction({ senderType: sender, receiverType: receiver }),
    );
  };

  const handleClose = () => {
    resetLocalState();
    dispatch(resetSep31SendAction());
    dispatch(resetActiveAssetAction());
  };

  if (sep31Send.status === ActionStatus.NEEDS_INPUT) {
    const { data } = sep31Send;

    // Select customer types
    if (!data.isTypeSelected) {
      return (
        <Modal visible={true} onClose={handleClose}>
          <Heading2 className="ModalHeading">
            Sender and receiver types
          </Heading2>

          <div className="ModalBody">
            <div>
              <Heading3>Sender</Heading3>
              {data.multipleSenderTypes?.map((sender) => (
                <RadioButton
                  onChange={() =>
                    handleTypeChange(CustomerType.SENDER, sender.type)
                  }
                  key={sender.type}
                  id={sender.type}
                  value={sender.type}
                  name="customer-sender"
                  label={
                    <span className="inline-block">
                      <code>{sender.type}</code> {sender.description}
                    </span>
                  }
                />
              ))}
            </div>

            <div>
              <Heading3>Receiver</Heading3>
              {data.multipleReceiverTypes?.map((receiver) => (
                <RadioButton
                  onChange={() =>
                    handleTypeChange(CustomerType.RECEIVER, receiver.type)
                  }
                  key={receiver.type}
                  id={receiver.type}
                  value={receiver.type}
                  name="customer-receiver"
                  label={
                    <span className="inline-block">
                      <code>{receiver.type}</code> {receiver.description}
                    </span>
                  }
                />
              ))}
            </div>

            {errorMessage && <p className="error">{errorMessage}</p>}
          </div>

          <div className="ModalButtonsFooter">
            <Button onClick={handleSelectTypes}>Submit</Button>
          </div>
        </Modal>
      );
    }

    // Data fields
    if (data.isTypeSelected) {
      const { transaction, sender, receiver } = data.fields;

      const allFields = {
        amount: {
          amount: {
            description: "amount to send",
          },
        },
        ...(sender ? { sender } : {}),
        ...(receiver ? { receiver } : {}),
        ...(transaction ? { transaction } : {}),
      };

      return (
        <Modal visible={true} onClose={handleClose}>
          <Heading2
            className="ModalHeading"
            tooltipText={
              <>
                These are the fields the receiving anchor requires. The sending
                client obtains them from the /customer endpoint.{" "}
                <TextLink
                  href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get"
                  isExternal
                >
                  Learn more
                </TextLink>
              </>
            }
          >
            Sender and receiver info
          </Heading2>

          <div className="ModalBody">
            {Object.entries(allFields).map(([sectionTitle, sectionItems]) => (
              <div className="vertical-spacing" key={sectionTitle}>
                <Heading3>{capitalizeString(sectionTitle)}</Heading3>
                {Object.entries(sectionItems || {}).map(([id, input]) => (
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

          <div className="ModalButtonsFooter">
            <Button onClick={handleSubmit}>Submit</Button>
          </div>
        </Modal>
      );
    }
  }

  return null;
};
