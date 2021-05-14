import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Transaction, TransactionBuilder } from "stellar-sdk";
import { Button, Heading2, Loader } from "@stellar/design-system";
import { Json } from "components/Json";
import { Modal } from "components/Modal";
import { fetchAccountAction } from "ducks/account";
import { sep8SubmitRevisedTransaction } from "ducks/sep8Send";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";
import { Toggle } from "components/Toggle";

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

  // user interaction handlers
  const handleSubmitPayment = () => {
    if (account.data?.id) {
      dispatch(sep8SubmitRevisedTransaction());
    }
  };

  // destructure sep8 data
  const { revisedTxXdr, submittedTxXdr } = sep8Send.data.reviseTransaction;
  // use effect
  useEffect(() => {
    if (submittedTxXdr) {
      const networkPassphrase = getNetworkConfig(settings.pubnet).network;
      const tx = TransactionBuilder.fromXDR(
        submittedTxXdr,
        networkPassphrase,
      ) as Transaction;
      setSubmittedTx(tx);
    }

    if (revisedTxXdr) {
      const networkPassphrase = getNetworkConfig(settings.pubnet).network;
      const tx = TransactionBuilder.fromXDR(
        revisedTxXdr,
        networkPassphrase,
      ) as Transaction;
      setRevisedTx(tx);
    }
  }, [revisedTxXdr, submittedTxXdr]);

  // use effect
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

  const renderSendPayment = () => (
    <>
      <Heading2 className="ModalHeading">
        Review & Submit SEP-8 Transaction
      </Heading2>

      <div className="ModalMessage">
        <p>
          Please review the updated operations before submitting your SEP-8
          payment.
        </p>
      </div>

      {submittedTx?.operations && (
        <>
          <label className="ModalLabel">Submitted transaction operations</label>
          <Json src={submittedTx.operations} />
        </>
      )}

      {revisedTx?.operations && (
        <>
          <label className="ModalLabel">Revised transaction operations</label>
          <Json src={revisedTx.operations} />
        </>
      )}

      {sep8Send.errorString && (
        <div className="ModalMessage error">
          <p>{sep8Send.errorString}</p>
        </div>
      )}

      <div className="ConfigurationItem ModalLabel">
        <label htmlFor="claimable-balance-supported">
          I authorize sending this revised transaction.
        </label>
        <Toggle
          id="claimable-balance-supported"
          checked={isApproved}
          onChange={() => {
            setIsApproved(!isApproved);
          }}
        />
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
      {/* Send payment */}
      {renderSendPayment()}
    </Modal>
  );
};
