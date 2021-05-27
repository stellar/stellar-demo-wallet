import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Loader } from "@stellar/design-system";
import { Heading2 } from "components/Heading";
import { Modal } from "components/Modal";
import {
  initiateSep8SendAction,
  sep8SendActionRequiredFieldsAction,
} from "ducks/sep8Send";
import { Sep9Field, Sep9FieldType } from "helpers/Sep9Fields";
import { useRedux } from "hooks/useRedux";
import {
  ActionStatus,
  Sep8ActionRequiredResultType,
  Sep8Step,
} from "types/types.d";

export const Sep8ActionRequiredForm = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { account, sep8Send } = useRedux("account", "sep8Send");
  const [fieldValues, setFieldValues] = useState<{
    [key: string]: string | File;
  }>({});
  const {
    actionFields,
    message,
    actionMethod,
    actionUrl,
  } = sep8Send.data.actionRequiredInfo;
  const { nextUrl, result } = sep8Send.data.actionRequiredResult;
  const dispatch = useDispatch();

  useEffect(() => {
    if (sep8Send.data.sep8Step === Sep8Step.SENT_ACTION_REQUIRED_FIELDS) {
      if (nextUrl && result === Sep8ActionRequiredResultType.FOLLOW_NEXT_URL) {
        window.open(nextUrl, "_blank");
      }

      if (account.data) {
        dispatch(
          initiateSep8SendAction({
            assetCode: sep8Send.data.assetCode,
            assetIssuer: sep8Send.data.assetIssuer,
            homeDomain: sep8Send.data.homeDomain,
          }),
        );
      }
    }
  }, [
    account.data,
    dispatch,
    nextUrl,
    result,
    sep8Send.data.assetCode,
    sep8Send.data.assetIssuer,
    sep8Send.data.homeDomain,
    sep8Send.data.sep8Step,
  ]);

  const handleSubmitActionRequiredFields = () => {
    dispatch(
      sep8SendActionRequiredFieldsAction({
        actionFields: fieldValues,
        actionMethod,
        actionUrl,
      }),
    );
  };

  const handleOnChangeField = ({
    fieldName,
    event,
  }: {
    fieldName: string;
    event: React.ChangeEvent<HTMLInputElement>;
  }) => {
    const files = event.target.files;
    const fieldValue = files?.length ? files[0] : event.target.value;
    const buffFieldValue = { ...fieldValues };
    buffFieldValue[fieldName] = fieldValue;
    setFieldValues(buffFieldValue);
  };

  const getInputParams = ({ sep9Field }: { sep9Field: Sep9Field }) => {
    const { name: fieldName, type: fieldType } = sep9Field;

    let inputValue: { [key: string]: any } = {
      value: fieldValues[fieldName] || "",
    };
    let inputType = "text";

    switch (fieldType) {
      case Sep9FieldType.DATE:
        inputType = "date";
        break;

      case Sep9FieldType.BINARY:
        inputType = "file";
        inputValue = {};
        break;

      case Sep9FieldType.NUMBER:
        inputType = "number";
        break;

      default:
        break;
    }
    if (fieldName === "email_address") {
      inputType = "email";
    }

    return { inputType, inputValue };
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

        {actionFields?.map((sep9Field) => {
          const { name: fieldName, description } = sep9Field;
          const { inputType, inputValue } = getInputParams({ sep9Field });

          return (
            <Input
              key={fieldName}
              id={`sep8-action-field-${fieldName}`}
              type={inputType}
              label={fieldName}
              onChange={(event) => handleOnChangeField({ fieldName, event })}
              multiple={false}
              note={description}
              {...inputValue}
            />
          );
        })}

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
