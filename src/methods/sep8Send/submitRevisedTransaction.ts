import StellarSdk, {
  Horizon,
  Keypair,
  Transaction,
  TransactionBuilder,
} from "stellar-sdk";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";

export const submitRevisedTransaction = async ({
  revisedTxXdr,
  isPubnet,
  secretKey,
}: {
  revisedTxXdr: string;
  isPubnet: boolean;
  secretKey: string;
}) => {
  const networkConfig = getNetworkConfig(isPubnet);
  const server = new StellarSdk.Server(networkConfig.url);
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
  const result: Horizon.TransactionResponse = await server.submitTransaction(
    transaction,
  );
  log.response({ title: "Submitted send payment transaction", body: result });
  log.instruction({
    title: `Payment sent 🎉`,
  });
  // log.instruction({
  //   title: `Payment of ${params.amount} ${params.assetCode} sent`,
  //   body: `Destination: ${params.destination}`,
  // });
  return result;
};
