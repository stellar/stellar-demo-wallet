import {
  Account,
  Asset,
  Keypair,
  Operation,
  Horizon,
  TransactionBuilder,
} from "stellar-sdk";
import { log } from "../../helpers/log";
import { createMemoFromType } from "../createMemoFromType";
import { AnyObject, TransactionStatus } from "../../types/types";
import {getNetworkConfig} from "../../helpers/getNetworkConfig";

export const pollWithdrawUntilComplete = async ({
  amount,
  secretKey,
  transactionId,
  token,
  transferServerUrl,
  networkPassphrase,
  networkUrl,
  assetCode,
  assetIssuer,
}: {
  amount: string;
  secretKey: string;
  transactionId: string;
  token: string;
  transferServerUrl: string;
  networkPassphrase: string;
  networkUrl: string;
  assetCode: string;
  assetIssuer: string;
}) => {
  const keypair = Keypair.fromSecret(secretKey);
  const server = new Horizon.Server(networkUrl);
  let currentStatus = TransactionStatus.INCOMPLETE;
  let requiredCustomerInfoUpdates: string[] | undefined;

  const transactionUrl = new URL(
    `${transferServerUrl}/transaction?id=${transactionId}`,
  );
  log.instruction({
    title: `Polling for updates \`${transactionUrl.toString()}\``,
  });

  const endStatuses = [
    TransactionStatus.COMPLETED,
    TransactionStatus.ERROR,
    TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE,
  ];
  let transactionJson = { transaction: {} as AnyObject };

  while (!endStatuses.includes(currentStatus)) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(transactionUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    // eslint-disable-next-line no-await-in-loop
    transactionJson = await response.json();

    if (transactionJson.transaction.status !== currentStatus) {
      currentStatus = transactionJson.transaction.status;

      log.instruction({
        title: `Transaction \`${transactionId}\` is in \`${transactionJson.transaction.status}\` status`,
      });

      switch (currentStatus) {
        case TransactionStatus.PENDING_USER_TRANSFER_START: {
          log.instruction({
            title: "The anchor is waiting for the funds for withdrawal",
          });

          const memo = createMemoFromType(
            transactionJson.transaction.withdraw_memo,
            transactionJson.transaction.withdraw_memo_type,
          );

          log.request({
            title: "Fetching account sequence number",
            body: keypair.publicKey(),
          });

          // eslint-disable-next-line no-await-in-loop
          const { sequence } = await server
            .accounts()
            .accountId(keypair.publicKey())
            .call();

          log.response({
            title: "Fetching account sequence number",
            body: sequence,
          });

          const account = new Account(keypair.publicKey(), sequence);
          const txn = new TransactionBuilder(account, {
            fee: getNetworkConfig().baseFee,
            networkPassphrase,
          })
            .addOperation(
              Operation.payment({
                destination:
                  transactionJson.transaction.withdraw_anchor_account,
                asset: new Asset(assetCode, assetIssuer),
                amount,
              }),
            )
            .addMemo(memo)
            .setTimeout(0)
            .build();

          txn.sign(keypair);

          log.request({
            title: "Submitting withdrawal transaction to Stellar",
            body: txn,
          });

          // eslint-disable-next-line no-await-in-loop
          const horizonResponse = await server.submitTransaction(txn);

          log.response({
            title: "Submitted withdrawal transaction to Stellar",
            body: horizonResponse,
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
        case TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE: {
          requiredCustomerInfoUpdates =
            transactionJson.transaction.required_customer_info_updates;

          log.instruction({
            title:
              "Certain pieces of information need to be updated by the user",
            body: requiredCustomerInfoUpdates,
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

  // We are showing log for this status in switch
  if (currentStatus !== TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE) {
    log.instruction({ title: `Transaction status \`${currentStatus}\`` });
  }

  return {
    currentStatus,
    transaction: transactionJson.transaction,
    requiredCustomerInfoUpdates,
  };
};
