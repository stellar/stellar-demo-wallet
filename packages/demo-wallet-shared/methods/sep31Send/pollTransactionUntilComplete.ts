import { log } from "../../helpers/log";
import { TransactionStatus } from "../../types/types";

export const pollTransactionUntilComplete = async ({
  sendServer,
  transactionId,
  token,
}: {
  sendServer: string;
  transactionId: string;
  token: string;
}) => {
  log.instruction({
    title:
      "Polling `/transactions/:id` endpoint until transaction status reaches end status",
  });

  let currentStatus;
  let resultJson;

  log.request({ title: `GET \`/transactions/${transactionId}\`` });

  while (
    ![
      TransactionStatus.PENDING_EXTERNAL,
      TransactionStatus.COMPLETED,
      TransactionStatus.ERROR,
    ].includes(currentStatus)
  ) {
    // eslint-disable-next-line no-await-in-loop
    const result = await fetch(`${sendServer}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status !== 200) {
      throw new Error(
        `GET \`/transactions/${transactionId}\` responded with status \`${result.status}\``,
      );
    }

    // eslint-disable-next-line no-await-in-loop
    resultJson = await result.json();

    if (currentStatus !== resultJson.transaction.status) {
      currentStatus = resultJson.transaction.status;

      log.instruction({
        title: `Transaction \`${transactionId}\` is in \`${resultJson.transaction.status}\` status`,
      });

      switch (currentStatus) {
        case TransactionStatus.PENDING_SENDER:
          log.instruction({
            title: "Awaiting payment to be initiated by sending anchor",
          });
          break;
        case TransactionStatus.PENDING_STELLAR:
          log.instruction({
            title:
              "Transaction has been submitted to Stellar network, but is not yet confirmed",
          });
          break;
        case TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE:
          log.instruction({
            title:
              "Certain pieces of information need to be updated by the sending anchor",
          });
          break;
        case TransactionStatus.PENDING_TRANSACTION_INFO_UPDATE:
          log.instruction({
            title:
              "Certain pieces of information need to be updated by the sending anchor",
          });
          break;
        case TransactionStatus.PENDING_RECEIVER:
          log.instruction({
            title: "Payment is being processed by the receiving anchor",
          });
          break;
        default:
        // do nothing
      }
    }

    // run loop every 2 seconds
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  if (!resultJson) {
    throw new Error("Something went wrong, there was no response");
  }

  log.response({
    title: `GET \`/transactions/${transactionId}\``,
    body: resultJson,
  });
};
