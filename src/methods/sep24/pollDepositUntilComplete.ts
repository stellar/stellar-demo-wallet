import { log } from "helpers/log";

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
  let currentStatus = "incomplete";
  let trustedAssetAdded;

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
              "The anchor is waiting on you to take the action described in the popup",
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
        case "pending_trust": {
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

  return { currentStatus, trustedAssetAdded };
};
