import StellarSdk, {
  Horizon,
  Keypair,
  Transaction,
  TransactionBuilder,
} from "stellar-sdk";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { buildPaymentTransaction } from "methods/submitPaymentTransaction";
import {
  Sep8ApprovalStatus,
  Sep8PaymentTransactionParams,
} from "types/types.d";

export const submitSEP8PaymentTransaction = async ({
  isPubnet,
  params,
  secretKey,
}: {
  isPubnet: boolean;
  params: Sep8PaymentTransactionParams;
  secretKey: string;
}) => {
  const server = new StellarSdk.Server(getNetworkConfig(isPubnet).url);
  const networkPassphrase = getNetworkConfig(isPubnet).network;
  const { approvalServer } = params;

  // build transaction
  let transaction: Transaction;
  try {
    transaction = await buildPaymentTransaction({
      isPubnet,
      params,
      server,
    });
  } catch (error) {
    throw new Error(
      `Failed to build transaction, error: ${getErrorString(error)})}`,
    );
  }

  // send transaction to SEP-8 approval server
  log.request({
    title: `Authorizing SEP-8 payment of ${params.amount} ${params.assetCode}`,
    body: `Destination: ${params.destination}`,
  });
  const sep8ApprovalResult = await fetch(approvalServer, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx: transaction.toEnvelope().toXDR("base64"),
    }),
  });

  // parse SEP-8 response
  const sep8ApprovalResultJson = await sep8ApprovalResult.json();

  if (sep8ApprovalResultJson.status === Sep8ApprovalStatus.REJECTED) {
    throw new Error(sep8ApprovalResultJson.error);
  }

  if (sep8ApprovalResultJson.status !== Sep8ApprovalStatus.REVISED) {
    throw new Error(
      `The SEP-8 flow for "${sep8ApprovalResultJson.status}" status is not implemented yet.`,
    );
  }

  log.response({
    title: `Payment transaction revised and authorized 🎉.`,
  });

  // parse revised transaction
  transaction = TransactionBuilder.fromXDR(
    sep8ApprovalResultJson.tx,
    networkPassphrase,
  ) as Transaction;

  // sign transaction
  try {
    const keypair = Keypair.fromSecret(secretKey);
    transaction.sign(keypair);
  } catch (error) {
    throw new Error(
      `Failed to sign transaction, error: ${getErrorString(error)}`,
    );
  }

  // submit transaction
  log.request({
    title: "Submitting send payment transaction",
    body: transaction,
  });
  const result: Horizon.TransactionResponse = await server.submitTransaction(
    transaction,
  );
  log.response({ title: "Submitted send payment transaction", body: result });
  log.instruction({
    title: `Payment of ${params.amount} ${params.assetCode} sent`,
    body: `Destination: ${params.destination}`,
  });

  return result;
};
