import { Keypair, Transaction } from "stellar-sdk";
import { log } from "../../helpers/log";

export const sign = ({
  challengeTransaction,
  networkPassphrase,
  secretKey,
}: {
  challengeTransaction: Transaction;
  networkPassphrase: string;
  secretKey: string;
}) => {
  log.instruction({
    title:
      "We’ve received a challenge transaction from the server that we need the sending anchor to sign with their Stellar private key",
  });

  const envelope = challengeTransaction.toEnvelope().toXDR("base64");
  const transaction = new Transaction(envelope, networkPassphrase);
  transaction.sign(Keypair.fromSecret(secretKey));

  log.instruction({ title: "SEP-10 signed transaction", body: transaction });
  log.instruction({
    title: "SEP-10 signed transaction, `base64` encoded",
    body: transaction.toEnvelope().toXDR("base64"),
  });

  return transaction;
};
