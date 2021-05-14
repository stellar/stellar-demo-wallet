import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { StrKey } from "stellar-sdk";
import {
  Button,
  Heading2,
  InfoBlock,
  Input,
  Loader,
} from "@stellar/design-system";
import { DataProvider } from "@stellar/wallet-sdk";
import { Modal } from "components/Modal";
import { TextLink } from "components/TextLink";
import { sep8ReviseTransaction } from "ducks/sep8Send";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8Approve = ({ onClose }: { onClose: () => void }) => {
  const { account, sep8Send, settings } = useRedux(
    "account",
    "sep8Send",
    "settings",
  );
  const dispatch = useDispatch();

  // form data
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [isDestinationFunded, setIsDestinationFunded] = useState(true);

  const resetFormState = () => {
    setDestination("");
    setAmount("");
    setIsDestinationFunded(true);
  };

  // destructure sep8 data
  const {
    approvalCriteria,
    approvalServer,
    assetCode,
    assetIssuer,
  } = sep8Send.data;

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

      dispatch(sep8ReviseTransaction(params));
    }
  };

  const handleCloseModal = useCallback(() => {
    resetFormState();
    onClose();
  }, [onClose]);

  // use effect
  useEffect(() => {
    if (
      sep8Send.status === ActionStatus.CAN_PROCEED &&
      sep8Send.data.reviseTransaction.revisedTxXdr
    ) {
      resetFormState();
    }
  }, [sep8Send.status, sep8Send.data.reviseTransaction.revisedTxXdr]);

  // helper function(s)
  const checkAndSetIsDestinationFunded = async () => {
    if (!destination || !StrKey.isValidEd25519PublicKey(destination)) {
      return;
    }

    const dataProvider = new DataProvider({
      serverUrl: getNetworkConfig(settings.pubnet).url,
      accountOrKey: destination,
      networkPassphrase: getNetworkConfig(settings.pubnet).network,
    });

    setIsDestinationFunded(await dataProvider.isAccountFunded());
  };

  const renderApprovePayment = () => (
    <>
      <Heading2 className="ModalHeading">Send SEP-8 Payment</Heading2>

      <div className="ModalBody">
        <Input
          id="send-destination"
          label="Destination"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          onBlur={() => {
            checkAndSetIsDestinationFunded();
          }}
        />

        <Input
          id="send-amount"
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
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
            <TextLink
              href="https://developers.stellar.org/docs/tutorials/create-account/"
              isExternal
            >
              Learn more about account creation
            </TextLink>
          </InfoBlock>
        )}
      </div>

      {sep8Send.errorString && (
        <div className="ModalMessage error">
          <p>{sep8Send.errorString}</p>
        </div>
      )}

      <div className="ModalButtonsFooter">
        {sep8Send.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSubmitPayment}
          disabled={sep8Send.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </div>
    </>
  );

  return (
    <Modal onClose={handleCloseModal} visible>
      {/* Send payment */}
      {renderApprovePayment()}
    </Modal>
  );
};
