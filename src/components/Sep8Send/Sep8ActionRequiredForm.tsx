import { useState } from "react";
import { Button, Input, Loader } from "@stellar/design-system";
import { Heading2 } from "components/Heading";
import { Modal } from "components/Modal";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8ActionRequiredForm = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { sep8Send } = useRedux("sep8Send");
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const { actionFields, message } = sep8Send.data.actionRequired;

  // user interaction handlers
  const handleSubmitActionRequiredFields = () => {
    console.log("TODO: handleSubmitActionRequiredFields");
  };

  const handleGetFieldValue = ({ fieldName }: { fieldName: string }) =>
    fieldValues[fieldName];

  const handleSetFieldValue = ({
    fieldName,
    fieldValue,
  }: {
    fieldName: string;
    fieldValue: string;
  }) => {
    const buffFieldValue = { ...fieldValues };
    buffFieldValue[fieldName] = fieldValue;
    setFieldValues(buffFieldValue);
  };

  const renderSendPayment = () => (
    <>
      <Heading2 className="ModalHeading">SEP-8 Action Required</Heading2>

      <div className="ModalBody">
        <div className="ModalMessage">
          <p>{message}</p>
        </div>

        <div className="ModalMessage">
          <p>The following information is needed before we can proceed:</p>
        </div>

        {actionFields.map((fieldName) => (
          <Input
            id={`sep8-action-field-${fieldName}`}
            label={fieldName}
            onChange={(e) =>
              handleSetFieldValue({ fieldName, fieldValue: e.target.value })
            }
            value={handleGetFieldValue({ fieldName })}
          />
        ))}

        {sep8Send.errorString && (
          <div className="ModalMessage error">
            <p>{sep8Send.errorString}</p>
          </div>
        )}
      </div>

      <div className="ModalButtonsFooter">
        {sep8Send.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSubmitActionRequiredFields}
          disabled={sep8Send.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </div>
    </>
  );

  return (
    <Modal onClose={onClose} visible>
      {renderSendPayment()}
    </Modal>
  );
};
