import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Transaction, TransactionBuilder } from "stellar-sdk";
import { Button, Checkbox, Loader } from "@stellar/design-system";
import { Heading2, Heading3 } from "components/Heading";
import { Json } from "components/Json";
import { Modal } from "components/Modal";
import { fetchAccountAction } from "ducks/account";
import { sep8SubmitRevisedTransactionAction } from "ducks/sep8Send";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8Review = ({ onClose }: { onClose: () => void }) => {
  const { account, sep8Send, settings } = useRedux(
    "account",
    "sep8Send",
    "settings",
  );
  const [submittedTx, setSubmittedTx] = useState<Transaction | undefined>();
  const [revisedTx, setRevisedTx] = useState<Transaction | undefined>();
  const [isApproved, setIsApproved] = useState(false);
  const dispatch = useDispatch();
  const { revisedTxXdr, submittedTxXdr } = sep8Send.data.revisedTransaction;

  // user interaction handlers
  const handleSubmitPayment = () => {
    if (revisedTxXdr && isApproved) {
      dispatch(sep8SubmitRevisedTransactionAction());
    }
  };

  // use effect: complete action, close modal and refresh account balances
  useEffect(() => {
    if (sep8Send.status === ActionStatus.SUCCESS && account.data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: account.data.id,
          secretKey: account.secretKey,
        }),
      );
      onClose();
    }
  }, [account.data?.id, account.secretKey, sep8Send.status, dispatch, onClose]);

  // use effect: parse transaction XDRs
  useEffect(() => {
    const networkPassphrase = getNetworkConfig(settings.pubnet).network;

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
  }, [revisedTxXdr, submittedTxXdr, settings.pubnet]);

  const renderSendPayment = () => (
    <>
      <Heading2 className="ModalHeading">
        Review & Submit SEP-8 Transaction
      </Heading2>

      <div className="ModalBody">
        <div className="ModalMessage">
          <p>
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

        {sep8Send.errorString && (
          <div className="ModalMessage error">
            <p>{sep8Send.errorString}</p>
          </div>
        )}

        <div className="CheckboxWrapper">
          <Checkbox
            id="sep8-send-approve"
            label="I approve executing these operations."
            checked={isApproved}
            onChange={() => {
              setIsApproved(!isApproved);
            }}
            disabled={sep8Send.status === ActionStatus.PENDING}
          />
        </div>
      </div>

      <div className="ModalButtonsFooter">
        {sep8Send.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSubmitPayment}
          disabled={sep8Send.status === ActionStatus.PENDING || !isApproved}
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
