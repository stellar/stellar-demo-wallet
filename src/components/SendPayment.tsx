import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, InfoBlock, Input, TextLink } from "@stellar/design-system";
import { DataProvider } from "@stellar/wallet-sdk";
import { StrKey } from "stellar-sdk";

import { fetchAccountAction } from "ducks/account";
import { sendPaymentAction, resetSendPaymentAction } from "ducks/sendPayment";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const SendPayment = () => {
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
  const [assetCode, setAssetCode] = useState("");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [isDestinationFunded, setIsDestinationFunded] = useState(true);

  const resetFormState = () => {
    setDestination("");
    setAmount("");
    setAssetCode("");
    setAssetIssuer("");
    setIsDestinationFunded(true);
  };

  useEffect(() => {
    if (sendPayment.status === ActionStatus.SUCCESS) {
      dispatch(
        fetchAccountAction({
          publicKey: data.id,
          secretKey,
        }),
      );
      dispatch(resetSendPaymentAction());
      resetFormState();
    }
  }, [sendPayment.status, secretKey, data?.id, dispatch]);

  const checkAndSetIsDestinationFunded = async () => {
    if (!destination || !StrKey.isValidEd25519PublicKey(destination)) {
      return;
    }

    const dataProvider = new DataProvider({
      serverUrl: getNetworkConfig(Boolean(settings.pubnet)).url,
      accountOrKey: destination,
      networkPassphrase: getNetworkConfig(Boolean(settings.pubnet)).network,
    });

    setIsDestinationFunded(await dataProvider.isAccountFunded());
  };

  const handleSubmit = () => {
    const params = {
      destination,
      isDestinationFunded,
      amount,
      assetCode,
      assetIssuer,
      publicKey: account.data?.id,
    };

    dispatch(sendPaymentAction(params));
  };

  return (
    <div className="SendForm Block">
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
      <Input
        id="send-asset-issuer"
        label="Asset issuer"
        value={assetIssuer}
        onChange={(e) => setAssetIssuer(e.target.value)}
      />

      {!isDestinationFunded && (
        <InfoBlock>
          The destination account doesn’t exist. A create account operation will
          be used to create this account.{" "}
          <TextLink
            href="https://developers.stellar.org/docs/tutorials/create-account/"
            target="_blank"
            rel="noreferrer"
          >
            Learn more about account creation
          </TextLink>
        </InfoBlock>
      )}

      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
};
