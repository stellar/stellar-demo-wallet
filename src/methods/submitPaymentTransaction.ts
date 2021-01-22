import StellarSdk, { BASE_FEE, Keypair } from "stellar-sdk";
import { getErrorString } from "helpers/getErrorString";
import { getNetworkConfig } from "helpers/getNetworkConfig";
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

  // Build transaction
  const transaction = await buildPaymentTransaction({
    isPubnet,
    params,
    server,
  });

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
  return server.submitTransaction(transaction);
};

const buildPaymentTransaction = async ({
  isPubnet,
  params,
  server,
}: {
  isPubnet: boolean;
  params: PaymentTransactionParams;
  server: any;
}) => {
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
      // TODO: add asset validation
      const asset =
        !assetCode || assetCode === "XLM"
          ? StellarSdk.Asset.native()
          : new StellarSdk.Asset(assetCode, assetIssuer);

      operation = StellarSdk.Operation.payment({
        destination,
        asset,
        amount: amount.toString(),
      });
    } else {
      // If destination account is not funded, create and fund it
      operation = StellarSdk.Operation.createAccount({
        destination,
        startingBalance: amount.toString(),
      });
    }

    // TODO: Do we need to add memo?

    transaction = new StellarSdk.TransactionBuilder(source, {
      // TODO: Do we need to have a custom fee option?
      fee: BASE_FEE,
      networkPassphrase: getNetworkConfig(isPubnet).network,
      timebounds: await server.fetchTimebounds(100),
    }).addOperation(operation);

    transaction = transaction.build();
  } catch (error) {
    throw new Error(
      `Failed to build transaction, error: ${getErrorString(error)})}`,
    );
  }
  return transaction;
};
