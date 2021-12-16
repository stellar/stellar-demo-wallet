import { Keypair, Transaction } from "stellar-sdk";
import { log } from "../../helpers/log";

export const sign = async ({
  challengeTransaction,
  networkPassphrase,
  secretKey,
  walletBackendEndpoint,
}: {
  challengeTransaction: Transaction;
  networkPassphrase: string;
  secretKey: string;
  walletBackendEndpoint: string;
}) => {
  log.instruction({
    title:
      "We’ve received a challenge transaction from the server that we need the sending anchor to sign with their Stellar private key",
  });
  
  for (const op of challengeTransaction.operations) {
    if (op.type === "manageData" && op.name === "client_domain") {
      // The anchor server supports client attribution, get a signature from the demo wallet backend server
      log.instruction({title: "anchor supports SEP-10 client attribution, requesting signature from demo wallet backend..."});
      const params = {
        transaction: challengeTransaction.toEnvelope().toXDR("base64"),
        network_passphrase: networkPassphrase
      };
      log.request({ title: "POST `/sign`", body: params });
      const urlParams = new URLSearchParams(params);
      const walletBackendSignEndpoint = `${walletBackendEndpoint}/sign`;

      const result = await fetch(walletBackendSignEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: urlParams.toString(),
      });
      const resultJson = await result.json();
      log.response({ title: "POST `/sign`", body: resultJson });
      challengeTransaction = new Transaction(resultJson.transaction, resultJson.network_passphrase);
      log.instruction({title: "challenge signed by demo wallet backend"});
      break;
    }
  }
  
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