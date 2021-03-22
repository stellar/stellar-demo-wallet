import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  Heading2,
  InfoBlock,
  Input,
  Loader,
} from "@stellar/design-system";
import { TextLink } from "components/TextLink";
import { DataProvider } from "@stellar/wallet-sdk";
import { StrKey } from "stellar-sdk";

import { fetchAccountAction } from "ducks/account";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { sendPaymentAction, resetSendPaymentAction } from "ducks/sendPayment";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, Asset, AssetType } from "types/types.d";

export const SendPayment = ({
  asset,
  onClose,
}: {
  asset?: Asset;
  onClose: () => void;
}) => {
  const { account, sendPayment, settings } = useRedux(
    "account",
    "sendPayment",
    "settings",
  );
  const { data, secretKey } = account;
  const dispatch = useDispatch();

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
      serverUrl: getNetworkConfig(settings.pubnet).url,
      accountOrKey: destination,
      networkPassphrase: getNetworkConfig(settings.pubnet).network,
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
            <TextLink
              href="https://developers.stellar.org/docs/tutorials/create-account/"
              isExternal
            >
              Learn more about account creation
            </TextLink>
          </InfoBlock>
        )}
      </div>

      {sendPayment.errorString && (
        <div className="ModalMessage error">
          <p>{sendPayment.errorString}</p>
        </div>
      )}

      <div className="ModalButtonsFooter">
        {sendPayment.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSubmit}
          disabled={sendPayment.status === ActionStatus.PENDING}
        >
          Submit
        </Button>
      </div>
    </>
  );
};
