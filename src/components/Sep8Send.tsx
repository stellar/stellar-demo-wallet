import { useEffect, useState } from "react";
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
import { resetActiveAssetAction } from "ducks/activeAsset";
import { resetSep8SendAction, sep8SendPaymentAction } from "ducks/sep8Send";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8Send = () => {
  const { account, sep8Send, settings } = useRedux(
    "account",
    "sep8Send",
    "settings",
  );
  const [sep8PaymentModalVisible, setSep8PaymentModalVisible] = useState(false);
  const dispatch = useDispatch();

  // Form data
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [isDestinationFunded, setIsDestinationFunded] = useState(true);

  // Destructure sep8 data
  const {
    approvalCriteria,
    approvalServer,
    assetCode,
    assetIssuer,
  } = sep8Send.data;

  // Use effect
  const resetFormState = () => {
    setDestination("");
    setAmount("");
    setIsDestinationFunded(true);
  };

  useEffect(() => {
    if (sep8Send.status === ActionStatus.CAN_PROCEED) {
      setSep8PaymentModalVisible(true);
    }

    return resetFormState();
  }, [sep8Send]);

  // user interaction handlers
  const handleCloseModal = () => {
    setSep8PaymentModalVisible(false);
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  };

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

      dispatch(sep8SendPaymentAction(params));
    }
  };

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

  const renderSendPayment = () => (
    <>
      <Heading2 className="ModalHeading">Send payment</Heading2>

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
    <Modal visible={sep8PaymentModalVisible} onClose={handleCloseModal}>
      {/* Send payment */}
      {renderSendPayment()}
    </Modal>
  );
};
