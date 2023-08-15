import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  InfoBlock,
  Input,
  TextLink,
  Modal,
} from "@stellar/design-system";
import { DataProvider } from "@stellar/wallet-sdk";
import { StrKey } from "stellar-sdk";

import { ErrorMessage } from "components/ErrorMessage";
import { fetchAccountAction } from "ducks/account";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { sendPaymentAction, resetSendPaymentAction } from "ducks/sendPayment";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus, Asset, AssetType } from "types/types";

export const SendPayment = ({
  asset,
  onClose,
}: {
  asset?: Asset;
  onClose: () => void;
}) => {
  const { account, sendPayment } = useRedux("account", "sendPayment");
  const { data, secretKey } = account;
  const dispatch: AppDispatch = useDispatch();

  // Form data
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [assetCode, setAssetCode] = useState(asset?.assetCode);
  const [assetIssuer, setAssetIssuer] = useState(asset?.assetIssuer || "");
  const [isDestinationFunded, setIsDestinationFunded] = useState(true);

  const resetFormState = () => {
    setDestination("");
    setAmount("");
    setAssetCode("");
    setAssetIssuer("");
    setIsDestinationFunded(true);
  };

  useEffect(
    () => () => {
      // Reset when component unmounts
      dispatch(resetSendPaymentAction());
      dispatch(resetActiveAssetAction());
      resetFormState();
    },
    [dispatch],
  );

  useEffect(() => {
    if (sendPayment.status === ActionStatus.SUCCESS && data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: data.id,
          secretKey,
        }),
      );
      dispatch(resetSendPaymentAction());
      dispatch(resetActiveAssetAction());
      resetFormState();
      onClose();
    }
  }, [sendPayment.status, secretKey, data?.id, dispatch, onClose]);

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

  const handleSubmit = () => {
    if (data?.id) {
      const params = {
        destination,
        isDestinationFunded,
        amount,
        assetCode,
        assetIssuer,
        publicKey: data.id,
      };

      dispatch(sendPaymentAction(params));
    }
  };

  return (
    <>
      <Modal.Heading>Send payment</Modal.Heading>

      <Modal.Body>
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
          onChange={(e) => setAssetCode(e.target.value)}
        />
        {asset?.assetType !== AssetType.NATIVE && (
          <Input
            id="send-asset-issuer"
            label="Asset issuer"
            value={assetIssuer}
            onChange={(e) => setAssetIssuer(e.target.value)}
          />
        )}

        {!isDestinationFunded && (
          <InfoBlock>
            The destination account doesn’t exist. A create account operation
            will be used to create this account.{" "}
            <TextLink href="https://developers.stellar.org/docs/tutorials/create-account/">
              Learn more about account creation
            </TextLink>
          </InfoBlock>
        )}
        <ErrorMessage message={sendPayment.errorString} />
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleSubmit}
          isLoading={sendPayment.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </Modal.Footer>
    </>
  );
};
