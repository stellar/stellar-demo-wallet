import { Horizon, Keypair, Transaction, TransactionBuilder } from "stellar-sdk";
import { getErrorString } from "../../helpers/getErrorString";
import { getNetworkConfig } from "../../helpers/getNetworkConfig";
import { log } from "../../helpers/log";

export const submitRevisedTransaction = async ({
  amount,
  assetCode,
  destination,
  revisedTxXdr,
  secretKey,
}: {
  amount: string;
  assetCode: string;
  destination: string;
  revisedTxXdr: string;
  secretKey: string;
}) => {
  const networkConfig = getNetworkConfig();
  const server = new Horizon.Server(networkConfig.url);
  const transaction = TransactionBuilder.fromXDR(
    revisedTxXdr,
    networkConfig.network,
  ) as Transaction;

  // sign transaction
  try {
    const keypair = Keypair.fromSecret(secretKey);
    transaction.sign(keypair);
  } catch (error) {
    throw new Error(
      `Failed to sign transaction, error: ${getErrorString(error)}`,
    );
  }

  // submit transaction
  log.request({
    title: "Submitting send payment transaction",
    body: transaction,
  });
  const result: Horizon.HorizonApi.SubmitTransactionResponse =
    await server.submitTransaction(transaction);
  log.response({ title: "Submitted send payment transaction", body: result });
  log.instruction({
    title: "SEP-8 send payment completed 🎉",
    body: `Payment of ${amount} ${assetCode} successfully sent to ${destination}.`,
  });
  return result;
};
