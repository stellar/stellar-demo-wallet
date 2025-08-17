import {
  Account,
  Asset,
  Horizon,
  Keypair, Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { createMemoFromType } from "./createMemoFromType";
import { log } from "../helpers/log";
import { getNetworkConfig } from "../helpers/getNetworkConfig";
import { SmartWalletService } from "../services/SmartWalletService";

export const sendFromClassicAccount = async (
  amount: string,
  transactionJson: any,
  keypair: Keypair,
  server: Horizon.Server,
  paymentAsset: Asset,
  networkPassphrase: string,
)  => {
  const memo = createMemoFromType(
    transactionJson.transaction.withdraw_memo,
    transactionJson.transaction.withdraw_memo_type,
  );

  log.request({
    title: "Fetching account sequence number",
    body: keypair.publicKey(),
  });

  // eslint-disable-next-line no-await-in-loop
  const { sequence } = await server
    .accounts()
    .accountId(keypair.publicKey())
    .call();

  log.response({
    title: "Fetching account sequence number",
    body: sequence,
  });

  const account = new Account(keypair.publicKey(), sequence);
  const txn = new TransactionBuilder(account, {
    fee: getNetworkConfig().baseFee,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: transactionJson.transaction.withdraw_anchor_account,
        asset: paymentAsset,
        amount,
      }),
    )
    .addMemo(memo)
    .setTimeout(0)
    .build();

  txn.sign(keypair);

  log.request({
    title: "Submitting withdrawal transaction to Stellar",
    body: txn,
  });

  // eslint-disable-next-line no-await-in-loop
  return await server.submitTransaction(txn);
}

export const sendFromContractAccount = async (
  asset: Asset,
  fromAcc: string,
  toAcc: string,
  amount: string,
  contractId: string,
) => {
  const swService = await SmartWalletService.getInstance();

  log.request({
    title: "Submitting withdrawal transaction to Stellar",
  });

  return await swService.transfer(
    asset.contractId(getNetworkConfig().rpcNetwork),
    fromAcc,
    toAcc,
    Number(amount),
    contractId,
  );
}
