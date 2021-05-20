import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Input, Loader } from "@stellar/design-system";
import { Heading2 } from "components/Heading";
import { Modal } from "components/Modal";
import {
  sep8ReviseTransactionAction,
  sep8SendActionRequiredParamsAction,
} from "ducks/sep8Send";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8ActionRequiredForm = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const { account, sep8Send } = useRedux("account", "sep8Send");
  const [fieldValues, setFieldValues] = useState<{ [key: string]: string }>({});
  const {
    actionFields,
    message,
    actionMethod,
    actionUrl,
  } = sep8Send.data.actionRequiredInfo;
  const { nextUrl, result } = sep8Send.data.actionRequiredResult;
  const dispatch = useDispatch();

  useEffect(() => {
    if (sep8Send.status !== ActionStatus.SUCCESS) {
      return;
    }

    if (result === "follow_next_url") {
      window.open(nextUrl, "_blank");
    }

    if (account.data) {
      dispatch(
        sep8ReviseTransactionAction({
          amount: sep8Send.data.revisedTransaction.amount,
          approvalServer: sep8Send.data.approvalServer,
          assetCode: sep8Send.data.assetCode,
          assetIssuer: sep8Send.data.assetIssuer,
          destination: sep8Send.data.revisedTransaction.destination,
          isDestinationFunded: true,
          publicKey: account.data?.id,
        }),
      );
    }

    onClose();
  }, [
    account.data,
    dispatch,
    nextUrl,
    onClose,
    result,
    sep8Send.data.revisedTransaction.amount,
    sep8Send.data.approvalServer,
    sep8Send.data.assetCode,
    sep8Send.data.assetIssuer,
    sep8Send.data.revisedTransaction.destination,
    sep8Send.status,
  ]);

  const handleSubmitActionRequiredFields = () => {
    dispatch(
      sep8SendActionRequiredParamsAction({
        actionFields: fieldValues,
        actionMethod,
        actionUrl,
      }),
    );
  };

  const handleGetFieldValue = ({ fieldName }: { fieldName: string }) =>
    fieldValues[fieldName] || "";

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
            key={fieldName}
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
