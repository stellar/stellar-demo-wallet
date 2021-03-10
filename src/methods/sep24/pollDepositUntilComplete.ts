import { log } from "helpers/log";
import { TransactionStatus } from "types/types.d";

export const pollDepositUntilComplete = async ({
  popup,
  transactionId,
  token,
  sep24TransferServerUrl,
  trustAssetCallback,
}: {
  popup: any;
  transactionId: string;
  token: string;
  sep24TransferServerUrl: string;
  trustAssetCallback: () => Promise<string>;
}) => {
  let currentStatus = TransactionStatus.INCOMPLETE;
  let trustedAssetAdded;

  const transactionUrl = new URL(
    `${sep24TransferServerUrl}/transaction?id=${transactionId}`,
  );
  log.instruction({
    title: `Polling for updates: ${transactionUrl.toString()}`,
  });

  const endStatuses = [
    TransactionStatus.PENDING_EXTERNAL,
    TransactionStatus.COMPLETED,
    TransactionStatus.ERROR,
  ];

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
      log.instruction({
        title: `Transaction ${transactionId} is in ${transactionJson.transaction.status} status`,
      });

      switch (currentStatus) {
        case TransactionStatus.PENDING_USER_TRANSFER_START: {
          log.instruction({
            title:
              "The anchor is waiting on you to take the action described in the popup",
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
        case TransactionStatus.PENDING_TRUST: {
          log.instruction({
            title:
              "You must add a trustline to the asset in order to receive your deposit",
          });

          try {
            // eslint-disable-next-line no-await-in-loop
            trustedAssetAdded = await trustAssetCallback();
          } catch (error) {
            throw new Error(error);
          }
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

  log.instruction({ title: `Transaction status: ${currentStatus}` });

  if (!endStatuses.includes(currentStatus) && popup.closed) {
    log.instruction({
      title: `The popup was closed before the transaction reached a terminal status, if your balance is not updated soon, the transaction may have failed.`,
    });
  }

  return { currentStatus, trustedAssetAdded };
};
