import {
  Keypair,
  Horizon,
  Account,
  Asset,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { getErrorMessage } from "../helpers/getErrorMessage";
import { getErrorString } from "../helpers/getErrorString";
import { getNetworkConfig } from "../helpers/getNetworkConfig";
import { log } from "../helpers/log";
import { PaymentTransactionParams } from "../types/types";
import { SmartWalletService } from "../services/SmartWalletService";
import { isNativeAsset } from "../helpers/isNativeAsset";

export const submitPaymentTransaction = async ({
  params,
  secretKey,
}: {
  params: PaymentTransactionParams;
  secretKey: string;
}) => {
  const server = new Horizon.Server(getNetworkConfig().url);
  const keypair = Keypair.fromSecret(secretKey);

  log.instruction({
    title: `Sending payment of ${params.amount} ${params.assetCode}`,
    body: `Destination: ${params.destination}`,
  });

  let transaction;

  // Build transaction
  try {
    transaction = await buildPaymentTransaction({
      params,
      server,
    });
  } catch (error) {
    throw new Error(
      `Failed to build transaction, error: ${getErrorString(error)}`,
    );
  }

  try {
    // Sign transaction
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
  params,
  server,
}: {
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
    const source = await new Account(publicKey, sequence);
    let operation;

    if (isDestinationFunded) {
      const asset =
        !assetCode || assetCode === "XLM"
          ? Asset.native()
          : new Asset(assetCode, assetIssuer);

      operation = Operation.payment({
        destination,
        asset,
        amount: amount.toString(),
      });
    } else {
      log.instruction({
        title:
          "Destination account does not exist, we are creating and funding it",
      });

      // If destination account is not funded, create and fund it
      operation = Operation.createAccount({
        destination,
        startingBalance: amount.toString(),
      });
    }

    transaction = new TransactionBuilder(source, {
      fee: getNetworkConfig().baseFee,
      networkPassphrase: getNetworkConfig().network,
      timebounds: await server.fetchTimebounds(100),
    }).addOperation(operation);

    transaction = transaction.build();
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }

  return transaction;
};

export const submitSorobanTransferTransaction = async ({
  destination,
  assetCode,
  assetIssuer,
  amount,
  fromAcc,
  signer,
} : {
  destination: string;
  assetCode: string;
  assetIssuer?: string;
  amount: string;
  fromAcc: string,
  signer: Keypair |string;
}) => {
  log.instruction({
    title: `Sending transfer of ${amount} ${assetCode}`,
    body: `Destination: ${destination}`,
  });

  const swService = SmartWalletService.getInstance();
  const asset = isNativeAsset(assetCode)
    ? Asset.native()
    : new Asset(assetCode, assetIssuer!);

  try {
    const result = await swService.transfer(
      asset.contractId(getNetworkConfig().rpcNetwork),
      fromAcc,
      destination,
      Number(amount),
      signer,
    );

    log.response({ title: "Submitted transfer transaction", body: result });
    log.instruction({
      title: `Transfer of ${amount} ${assetCode} sent`,
      body: `Destination: ${destination}`,
    });

    return result;
  } catch (error) {
    throw new Error(
      `Failed to submit transaction, error: ${getErrorString(error)}`,
    );
  }
}