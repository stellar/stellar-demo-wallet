import { getErrorMessage } from "../../helpers/getErrorMessage";
import { log } from "../../helpers/log";
import { SepInstructions, TransactionStatus } from "../../types/types";

export const pollDepositUntilComplete = async ({
  transactionId,
  token,
  transferServerUrl,
  trustAssetCallback,
  dispatchInstructions,
}: {
  transactionId: string;
  token: string;
  transferServerUrl: string;
  trustAssetCallback: () => Promise<string>;
  dispatchInstructions: (instructions: SepInstructions) => void;
}) => {
  let currentStatus = TransactionStatus.INCOMPLETE;
  let trustedAssetAdded;
  let requiredCustomerInfoUpdates: string[] | undefined;

  const transactionUrl = new URL(
    `${transferServerUrl}/transaction?id=${transactionId}`,
  );
  log.instruction({
    title: `Polling for updates \`${transactionUrl.toString()}\``,
  });

  const endStatuses = [
    TransactionStatus.PENDING_EXTERNAL,
    TransactionStatus.COMPLETED,
    TransactionStatus.ERROR,
    TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE,
  ];

  while (!endStatuses.includes(currentStatus)) {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(transactionUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });

    // eslint-disable-next-line no-await-in-loop
    const transactionJson = await response.json();

    if (transactionJson.transaction.status !== currentStatus) {
      currentStatus = transactionJson.transaction.status;

      // eslint-disable-next-line no-param-reassign
      // popup.location.href = transactionJson.transaction.more_info_url;
      log.instruction({
        title: `Transaction \`${transactionId}\` is in \`${transactionJson.transaction.status}\` status`,
      });

      switch (currentStatus) {
        case TransactionStatus.PENDING_USER_TRANSFER_START: {
          log.instruction({
            title:
              "The anchor is waiting on you to take the action described in the popup",
          });

          if (transactionJson.transaction.instructions) {
            dispatchInstructions(transactionJson.transaction.instructions);
          }

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
            throw new Error(getErrorMessage(error));
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
    trustedAssetAdded,
    requiredCustomerInfoUpdates,
  };
};
