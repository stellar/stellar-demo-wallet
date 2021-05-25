import StellarSdk, { BASE_FEE, Keypair } from "stellar-sdk";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { PaymentTransactionParams } from "types/types.d";

export const submitPaymentTransaction = async ({
  isPubnet,
  params,
  secretKey,
}: {
  isPubnet: boolean;
  params: PaymentTransactionParams;
  secretKey: string;
}) => {
  const server = new StellarSdk.Server(getNetworkConfig(isPubnet).url);

  log.instruction({
    title: `Sending payment of ${params.amount} ${params.assetCode}`,
    body: `Destination: ${params.destination}`,
  });

  let transaction;

  // Build transaction
  try {
    transaction = await buildPaymentTransaction({
      isPubnet,
      params,
      server,
    });
  } catch (error) {
    throw new Error(
      `Failed to build transaction, error: ${getErrorString(error)})}`,
    );
  }

  try {
    // Sign transaction
    const keypair = Keypair.fromSecret(secretKey);
    await transaction.sign(keypair);
  } catch (error) {
    throw new Error(
      `Failed to sign transaction, error: ${getErrorString(error)}`,
    );
  }

  // Submit transaction
  log.request({
    title: "Submitting send payment transaction",
    body: transaction,
  });

  const result = await server.submitTransaction(transaction);
  log.response({ title: "Submitted send payment transaction", body: result });
  log.instruction({
    title: `Payment of ${params.amount} ${params.assetCode} sent`,
    body: `Destination: ${params.destination}`,
  });

  return result;
};

export const buildPaymentTransaction = async ({
  isPubnet,
  params,
  server,
}: {
  isPubnet: boolean;
  params: PaymentTransactionParams;
  server: any;
}) => {
  log.instruction({ title: "Building send payment transaction" });

  let transaction;
  try {
    const {
      destination,
      isDestinationFunded,
      amount,
      assetCode,
      assetIssuer,
      publicKey,
    } = params;
    const { sequence } = await server.loadAccount(publicKey);
    const source = await new StellarSdk.Account(publicKey, sequence);
    let operation;

    if (isDestinationFunded) {
      const asset =
        !assetCode || assetCode === "XLM"
          ? StellarSdk.Asset.native()
          : new StellarSdk.Asset(assetCode, assetIssuer);

      operation = StellarSdk.Operation.payment({
        destination,
        asset,
        amount: amount.toString(),
        withMuxing: true,
      });
    } else {
      log.instruction({
        title:
          "Destination account does not exist, we are creating and funding it",
      });

      // If destination account is not funded, create and fund it
      operation = StellarSdk.Operation.createAccount({
        destination,
        startingBalance: amount.toString(),
      });
    }

    transaction = new StellarSdk.TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: getNetworkConfig(isPubnet).network,
      timebounds: await server.fetchTimebounds(100),
    }).addOperation(operation);

    transaction = transaction.build();
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }

  return transaction;
};
