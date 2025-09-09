import {
  Asset,
  Horizon,
  Keypair,
} from "@stellar/stellar-sdk";
import { log } from "../../helpers/log";
import { AnyObject, TransactionStatus } from "../../types/types";
import {
  sendFromClassicAccount,
  sendFromContractAccount,
} from "../sendWithdrawPayment";

export const pollWithdrawUntilComplete = async ({
  secretKey,
  popup,
  transactionId,
  token,
  sep24TransferServerUrl,
  networkPassphrase,
  networkUrl,
  assetCode,
  assetIssuer,
  sep9Fields,
  contractId,
}: {
  secretKey?: string;
  popup: any;
  transactionId: string;
  token: string;
  sep24TransferServerUrl: string;
  networkPassphrase: string;
  networkUrl: string;
  assetCode: string;
  assetIssuer: string;
  sep9Fields?: AnyObject;
  contractId?: string;
}) => {
  const server = new Horizon.Server(networkUrl);
  let currentStatus = TransactionStatus.INCOMPLETE;

  const transactionUrl = new URL(
    `${sep24TransferServerUrl}/transaction?id=${transactionId}&lang=${
      sep9Fields?.lang || "en"
    }`,
  );
  log.instruction({
    title: `Polling for updates \`${transactionUrl.toString()}\``,
  });

  const endStatuses = [TransactionStatus.COMPLETED, TransactionStatus.ERROR];

  while (!popup.closed && !endStatuses.includes(currentStatus)) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(transactionUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    // eslint-disable-next-line no-await-in-loop
    const transactionJson = await response.json();

    if (transactionJson.transaction.status !== currentStatus) {
      currentStatus = transactionJson.transaction.status;
      // eslint-disable-next-line no-param-reassign
      popup.location.href = transactionJson.transaction.more_info_url;

      log.response({
        title: `Transaction \`${transactionId}\` is in \`${transactionJson.transaction.status}\` status.`,
        body: transactionJson.transaction,
      });

      switch (currentStatus) {
        case TransactionStatus.PENDING_USER_TRANSFER_START: {
          log.instruction({
            title:
              "The anchor is waiting for you to send the funds for withdrawal",
          });
          const paymentAsset = assetCode === "XLM" ? Asset.native() : new Asset(assetCode, assetIssuer);

          let response;
          if (!contractId) {
            const keypair = Keypair.fromSecret(secretKey!);
            response = await sendFromClassicAccount(
              transactionJson.transaction.amount_in,
              transactionJson,
              keypair,
              server,
              paymentAsset,
              networkPassphrase,
            );
          } else {
            response = await sendFromContractAccount(
              transactionJson.transaction.amount_in,
              paymentAsset,
              contractId,
              transactionJson.transaction.withdraw_anchor_account,
              transactionJson,
              server,
            );
          }
          log.response({
            title: "Submitted withdrawal transaction to Stellar",
            body: response,
          });
          break;
        }
        case TransactionStatus.PENDING_ANCHOR: {
          log.instruction({
            title: "The anchor is processing the transaction",
          });
          break;
        }
        case TransactionStatus.PENDING_STELLAR: {
          log.instruction({
            title: "The Stellar network is processing the transaction",
          });
          break;
        }
        case TransactionStatus.PENDING_EXTERNAL: {
          log.instruction({
            title: "The transaction is being processed by an external system",
          });
          break;
        }
        case TransactionStatus.PENDING_USER: {
          log.instruction({
            title:
              "The anchor is waiting for you to take the action described in the popup",
          });
          break;
        }
        case TransactionStatus.ERROR: {
          log.instruction({
            title: "There was a problem processing your transaction",
          });
          break;
        }
        default:
        // do nothing
      }
    }
    // run loop every 2 seconds
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  log.instruction({ title: `Transaction status \`${currentStatus}\`` });

  if (!endStatuses.includes(currentStatus) && popup.closed) {
    log.instruction({
      title: `The popup was closed before the transaction reached a terminal status, if your balance is not updated soon, the transaction may have failed.`,
    });
  }

  return currentStatus;
};