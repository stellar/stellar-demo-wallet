import StellarSdk, {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "stellar-sdk";
import { log } from "helpers/log";
import { createMemoFromType } from "methods/createMemoFromType";

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
}: {
  secretKey: string;
  popup: any;
  transactionId: string;
  token: string;
  sep24TransferServerUrl: string;
  networkPassphrase: string;
  networkUrl: string;
  assetCode: string;
  assetIssuer: string;
}) => {
  const keypair = Keypair.fromSecret(secretKey);
  const server = new StellarSdk.Server(networkUrl);
  let currentStatus = "incomplete";

  const transactionUrl = new URL(
    `${sep24TransferServerUrl}/transaction?id=${transactionId}`,
  );
  log.instruction({
    title: `Polling for updates: ${transactionUrl.toString()}`,
  });

  while (!popup.closed && !["completed", "error"].includes(currentStatus)) {
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
      log.instruction({
        title: `Transaction ${transactionId} is in ${transactionJson.transaction.status} status`,
      });

      switch (currentStatus) {
        case "pending_user_transfer_start": {
          log.instruction({
            title:
              "The anchor is waiting for you to send the funds for withdrawal",
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
            fee: BASE_FEE,
            networkPassphrase,
          })
            .addOperation(
              Operation.payment({
                destination:
                  transactionJson.transaction.withdraw_anchor_account,
                asset: new Asset(assetCode, assetIssuer),
                amount: transactionJson.transaction.amount_in,
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
            title: "Submitting withdrawal transaction to Stellar",
            body: horizonResponse,
          });
          break;
        }
        case "pending_anchor": {
          log.instruction({
            title: "The anchor is processing the transaction",
          });
          break;
        }
        case "pending_stellar": {
          log.instruction({
            title: "The Stellar network is processing the transaction",
          });
          break;
        }
        case "pending_external": {
          log.instruction({
            title: "The transaction is being processed by an external system",
          });
          break;
        }
        case "pending_user": {
          log.instruction({
            title:
              "The anchor is waiting for you to take the action described in the popup",
          });
          break;
        }
        case "error": {
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
  log.instruction({ title: `Transaction status: ${currentStatus}` });
  if (!["completed", "error"].includes(currentStatus) && popup.closed) {
    log.instruction({
      title: `The popup was closed before the transaction reached a terminal status, if your balance is not updated soon, the transaction may have failed.`,
    });
  }

  return currentStatus;
};
