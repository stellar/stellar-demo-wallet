import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Transaction, TransactionBuilder } from "stellar-sdk";
import { Button, Checkbox, Modal, Heading3 } from "@stellar/design-system";
import { ErrorMessage } from "components/ErrorMessage";
import { Json } from "components/Json";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { fetchAccountAction } from "ducks/account";
import { sep8SubmitRevisedTransactionAction } from "ducks/sep8Send";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus, Sep8Step } from "types/types";

export const Sep8Review = ({ onClose }: { onClose: () => void }) => {
  const { account, sep8Send } = useRedux("account", "sep8Send");
  const [submittedTx, setSubmittedTx] = useState<Transaction | undefined>();
  const [revisedTx, setRevisedTx] = useState<Transaction | undefined>();
  const [isApproved, setIsApproved] = useState(false);
  const dispatch: AppDispatch = useDispatch();
  const { revisedTxXdr, submittedTxXdr } = sep8Send.data.revisedTransaction;
  const { sep8Step } = sep8Send.data;

  // user interaction handlers
  const handleSubmitPayment = () => {
    if (revisedTxXdr && isApproved) {
      dispatch(sep8SubmitRevisedTransactionAction());
    }
  };

  // use effect: complete action, close modal and refresh account balances
  useEffect(() => {
    if (sep8Step === Sep8Step.COMPLETE && account.data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: account.data.id,
          secretKey: account.secretKey,
        }),
      );
      onClose();
    }
  }, [account.data?.id, account.secretKey, dispatch, onClose, sep8Step]);

  // use effect: parse transaction XDRs
  useEffect(() => {
    const networkPassphrase = getNetworkConfig().network;

    if (submittedTxXdr) {
      const tx = TransactionBuilder.fromXDR(
        submittedTxXdr,
        networkPassphrase,
      ) as Transaction;
      setSubmittedTx(tx);
    }

    if (revisedTxXdr) {
      const tx = TransactionBuilder.fromXDR(
        revisedTxXdr,
        networkPassphrase,
      ) as Transaction;
      setRevisedTx(tx);
    }
  }, [revisedTxXdr, submittedTxXdr]);

  const renderSendPayment = () => (
    <>
      <Modal.Heading>Review & Submit SEP-8 Transaction</Modal.Heading>

      <Modal.Body>
        <div className="ModalMessage">
          <p>
            {sep8Send.data.actionRequiredResult.result &&
              "KYC has been approved. "}
            Please review the updated operations before submitting your SEP-8
            payment.
          </p>
        </div>

        {submittedTx?.operations && (
          <>
            <Heading3>Original transaction operations</Heading3>
            <Json src={submittedTx.operations} />
          </>
        )}

        {revisedTx?.operations && (
          <>
            <Heading3>Revised transaction operations</Heading3>
            <Json src={revisedTx.operations} />
          </>
        )}

        <ErrorMessage marginBottom="1rem" message={sep8Send.errorString} />

        <Checkbox
          id="sep8-send-approve"
          label="I approve executing these operations."
          checked={isApproved}
          onChange={() => {
            setIsApproved(!isApproved);
          }}
          disabled={sep8Send.status === ActionStatus.PENDING}
        />
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleSubmitPayment}
          disabled={!isApproved}
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
