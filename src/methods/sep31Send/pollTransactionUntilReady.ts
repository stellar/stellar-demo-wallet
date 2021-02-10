import { log } from "helpers/log";

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
    title:
      "Poll /transactions/:id endpoint until transaction status is 'pending_sender'",
  });

  let transactionStatus;

  while (transactionStatus !== "pending_sender") {
    log.request({ url: `GET /transactions/${transactionId}` });
    // eslint-disable-next-line no-await-in-loop
    const result = await fetch(`${sendServer}/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (result.status !== 200) {
      throw new Error(
        `GET /transactions/${transactionId} responded with status ${result.status}`,
      );
    }

    // eslint-disable-next-line no-await-in-loop
    const resultJson = await result.json();
    log.response({
      url: `GET /transactions/${transactionId}`,
      body: resultJson,
    });
    transactionStatus = resultJson.transaction.status;

    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
};
