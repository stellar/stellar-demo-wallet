import { Keypair, Transaction, xdr } from "stellar-sdk";
import { log } from "helpers/log";

export const sign = ({
  challengeTransaction,
  networkPassphrase,
  secretKey,
}: {
  challengeTransaction: any;
  networkPassphrase: string;
  secretKey: string;
}) => {
  const envelope = xdr.TransactionEnvelope.fromXDR(
    challengeTransaction,
    "base64",
  );
  const transaction = new Transaction(envelope, networkPassphrase);
  transaction.sign(Keypair.fromSecret(secretKey));

  log.instruction({ title: "SEP-0010 Signed Transaction", body: transaction });
  log.instruction({
    title: "Base64 Encoded",
    body: transaction.toEnvelope().toXDR("base64"),
  });

  return transaction;
};
