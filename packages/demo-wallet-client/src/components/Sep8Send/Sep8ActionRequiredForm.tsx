import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Modal } from "@stellar/design-system";
import { ErrorMessage } from "components/ErrorMessage";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import {
  initiateSep8SendAction,
  sep8ReviseTransactionAction,
  sep8SendActionRequiredFieldsAction,
} from "ducks/sep8Send";
import {
  Sep9Field,
  Sep9FieldType,
} from "demo-wallet-shared/build/helpers/Sep9Fields";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import {
  ActionStatus,
  Sep8ActionRequiredResultType,
  Sep8Step,
} from "types/types";

export const Sep8ActionRequiredForm = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { account, sep8Send } = useRedux("account", "sep8Send");
  const [fieldValues, setFieldValues] = useState<{
    [key: string]: string | File;
  }>({});
  const { actionFields, message, actionMethod, actionUrl } =
    sep8Send.data.actionRequiredInfo;
  const { nextUrl, result } = sep8Send.data.actionRequiredResult;
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const shouldOpenActionUrl = actionMethod === "GET";
    if (
      shouldOpenActionUrl ||
      sep8Send.data.sep8Step === Sep8Step.SENT_ACTION_REQUIRED_FIELDS
    ) {
      if (shouldOpenActionUrl) {
        window.open(actionUrl, "_blank");
      }

      if (nextUrl && result === Sep8ActionRequiredResultType.FOLLOW_NEXT_URL) {
        window.open(nextUrl, "_blank");

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

      if (
        account.data &&
        result === Sep8ActionRequiredResultType.NO_FURTHER_ACTION_REQUIRED
      ) {
        const params = {
          destination: sep8Send.data.revisedTransaction.destination,
          isDestinationFunded: true,
          amount: sep8Send.data.revisedTransaction.amount,
          assetCode: sep8Send.data.assetCode,
          assetIssuer: sep8Send.data.assetIssuer,
          publicKey: account.data?.id,
          approvalServer: sep8Send.data.approvalServer,
        };

        dispatch(sep8ReviseTransactionAction(params));
      }
    }
  }, [
    actionMethod,
    actionUrl,
    account.data,
    dispatch,
    nextUrl,
    result,
    sep8Send.data.approvalServer,
    sep8Send.data.assetCode,
    sep8Send.data.assetIssuer,
    sep8Send.data.homeDomain,
    sep8Send.data.revisedTransaction.amount,
    sep8Send.data.revisedTransaction.destination,
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
      <Modal.Heading>SEP-8 Action Required</Modal.Heading>

      <Modal.Body>
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

        <ErrorMessage message={sep8Send.errorString} />
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleSubmitActionRequiredFields}
          isLoading={sep8Send.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </Modal.Footer>
    </>
  );

  return (
    <Modal onClose={onClose} visible parentId={CSS_MODAL_PARENT_ID}>
      {renderSendPayment()}
    </Modal>
  );
};
