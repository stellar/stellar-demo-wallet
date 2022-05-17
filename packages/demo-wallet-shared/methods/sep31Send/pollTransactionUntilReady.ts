import { log } from "../../helpers/log";
import { TransactionStatus, Sep31GetTransaction } from "../../types/types";

export const pollTransactionUntilReady = async ({
  sendServer,
  transactionId,
  token,
}: {
  sendServer: string;
  transactionId: string;
  token: string;
}) => {
  log.instruction({
    title: `Polling \`/transactions/:id\` endpoint until transaction status is \`${TransactionStatus.PENDING_SENDER}\``,
  });

  let transactionStatus;
  let resultJson: Sep31GetTransaction = {};

  while (transactionStatus !== TransactionStatus.PENDING_SENDER) {
    log.request({ title: `GET \`/transactions/${transactionId}\`` });
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
    log.response({
      title: `GET \`/transactions/${transactionId}\``,
      body: resultJson,
    });
    transactionStatus = resultJson.transaction?.status;

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return resultJson;
};
