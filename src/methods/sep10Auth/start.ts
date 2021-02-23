import { Keypair, Transaction } from "stellar-sdk";
import { log } from "helpers/log";

export const start = async ({
  authEndpoint,
  secretKey,
}: {
  authEndpoint: string;
  secretKey: string;
}) => {
  const publicKey = Keypair.fromSecret(secretKey).publicKey();
  const params = { account: publicKey };

  log.instruction({
    title:
      "Start the SEP-0010 flow to authenticate the sending anchor's Stellar account",
  });

  log.request({ title: "GET /auth", body: params });

  const authURL = new URL(authEndpoint);
  Object.entries(params).forEach(([key, value]) => {
    authURL.searchParams.append(key, value);
  });

  const result = await fetch(authURL.toString());
  const resultJson = await result.json();
  log.response({ title: "GET /auth", body: resultJson });

  if (!resultJson.transaction) {
    throw new Error("The response didn't contain a transaction");
  }

  const transactionObj = new Transaction(
    resultJson.transaction,
    resultJson.network_passphrase,
  );

  if (Number.parseInt(transactionObj.sequence, 10) !== 0) {
    throw new Error("Transaction sequence must be zero");
  }

  return resultJson.transaction;
};
