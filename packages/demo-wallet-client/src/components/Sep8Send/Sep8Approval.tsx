import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { StrKey } from "stellar-sdk";
import {
  Button,
  InfoBlock,
  Input,
  TextLink,
  Modal,
} from "@stellar/design-system";
import { DataProvider } from "@stellar/wallet-sdk";
import { ErrorMessage } from "components/ErrorMessage";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import {
  sep8ClearErrorAction,
  sep8ReviseTransactionAction,
} from "ducks/sep8Send";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus, Sep8Step } from "types/types";

export const Sep8Approval = ({ onClose }: { onClose: () => void }) => {
  const { account, sep8Send } = useRedux("account", "sep8Send");
  const { approvalCriteria, approvalServer, assetCode, assetIssuer } =
    sep8Send.data;
  const [amount, setAmount] = useState(sep8Send.data.revisedTransaction.amount);
  const [destination, setDestination] = useState(
    sep8Send.data.revisedTransaction.destination,
  );
  const [isDestinationFunded, setIsDestinationFunded] = useState(true);
  const dispatch: AppDispatch = useDispatch();

  const resetFormState = () => {
    setDestination("");
    setAmount("");
    setIsDestinationFunded(true);
  };

  useEffect(() => {
    if (sep8Send.data.sep8Step === Sep8Step.PENDING) {
      onClose();
    }
  }, [onClose, sep8Send.data.sep8Step]);

  // user interaction handlers
  const handleSubmitPayment = () => {
    if (account.data?.id) {
      const params = {
        destination,
        isDestinationFunded,
        amount,
        assetCode,
        assetIssuer,
        publicKey: account.data?.id,
        approvalServer,
      };

      dispatch(sep8ReviseTransactionAction(params));
    }
  };

  const handleCloseModal = () => {
    resetFormState();
    onClose();
  };

  // helper function(s)
  const checkAndSetIsDestinationFunded = async () => {
    if (!destination || !StrKey.isValidEd25519PublicKey(destination)) {
      return;
    }

    const dataProvider = new DataProvider({
      serverUrl: getNetworkConfig().url,
      accountOrKey: destination,
      networkPassphrase: getNetworkConfig().network,
    });

    setIsDestinationFunded(await dataProvider.isAccountFunded());
  };

  const renderApprovePayment = () => (
    <>
      <Modal.Heading>Send SEP-8 Payment</Modal.Heading>

      <Modal.Body>
        <Input
          id="send-destination"
          label="Destination"
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            if (sep8Send.errorString) {
              dispatch(sep8ClearErrorAction());
            }
          }}
          onBlur={checkAndSetIsDestinationFunded}
        />

        <Input
          id="send-amount"
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (sep8Send.errorString) {
              dispatch(sep8ClearErrorAction());
            }
          }}
        />

        <Input
          id="send-asset-code"
          label="Asset code"
          value={assetCode}
          disabled
        />

        <Input
          id="send-asset-issuer"
          label="Asset issuer"
          value={assetIssuer}
          disabled
        />

        <InfoBlock>
          <strong>Approval criteria: </strong>
          {approvalCriteria}
        </InfoBlock>

        {!isDestinationFunded && (
          <InfoBlock>
            The destination account doesn’t exist. A create account operation
            will be used to create this account.{" "}
            <TextLink href="https://developers.stellar.org/docs/tutorials/create-account/">
              Learn more about account creation
            </TextLink>
          </InfoBlock>
        )}

        <ErrorMessage message={sep8Send.errorString} />
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleSubmitPayment}
          isLoading={sep8Send.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </Modal.Footer>
    </>
  );

  return (
    <Modal onClose={handleCloseModal} visible parentId={CSS_MODAL_PARENT_ID}>
      {renderApprovePayment()}
    </Modal>
  );
};
