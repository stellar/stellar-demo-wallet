import StellarSdk, { Transaction } from "stellar-sdk";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { buildPaymentTransaction } from "methods/submitPaymentTransaction";
import {
  Sep8RevisedTransactionInfo,
  Sep8ApprovalStatus,
  Sep8PaymentTransactionParams,
} from "types/types.d";

export const revisePaymentTransaction = async ({
  isPubnet,
  params,
}: {
  isPubnet: boolean;
  params: Sep8PaymentTransactionParams;
}): Promise<undefined | Sep8RevisedTransactionInfo> => {
  const server = new StellarSdk.Server(getNetworkConfig(isPubnet).url);
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
  const submittedTxXdr = transaction.toEnvelope().toXDR("base64");
  const sep8ApprovalResult = await fetch(approvalServer, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx: submittedTxXdr,
    }),
  });

  // parse SEP-8 response
  const sep8ApprovalResultJson = await sep8ApprovalResult.json();
  switch (sep8ApprovalResultJson.status) {
    case Sep8ApprovalStatus.PENDING: {
      const dateStr = new Date(sep8ApprovalResultJson.timeout).toLocaleString();
      log.response({
        title: "Authorization pending",
        body: `The issuer could not determine whether to approve the transaction at this time. You can re-submit the same transaction on ${dateStr}.`,
      });
      if (sep8ApprovalResultJson.message) {
        log.instruction({ title: sep8ApprovalResultJson.message });
      }
      return undefined;
    }

    case Sep8ApprovalStatus.REJECTED:
      throw new Error(sep8ApprovalResultJson.error);

    case Sep8ApprovalStatus.REVISED:
    case Sep8ApprovalStatus.SUCCESS: {
      log.response({
        title: `Payment transaction revised and authorized 🎉.`,
      });

      const revisedData: Sep8RevisedTransactionInfo = {
        amount: params.amount,
        destination: params.destination,
        submittedTxXdr,
        revisedTxXdr: sep8ApprovalResultJson.tx,
      };
      return revisedData;
    }

    default:
      throw new Error(
        `The SEP-8 flow for "${sep8ApprovalResultJson.status}" status is not implemented yet.`,
      );
  }
};
