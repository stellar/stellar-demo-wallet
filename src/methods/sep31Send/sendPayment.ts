import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Memo,
  Operation,
  Server,
  TransactionBuilder,
} from "stellar-sdk";
import { log } from "helpers/log";
import { MemoTypeString } from "types/types.d";

interface SendPaymentProps {
  secretKey: string;
  assetCode: string;
  assetIssuer: string;
  networkUrl: string;
  networkPassphrase: string;
  amount: string;
  sendMemo: string;
  sendMemoType: MemoTypeString;
  receiverAddress: string;
}

export const sendPayment = async ({
  secretKey,
  assetCode,
  assetIssuer,
  networkUrl,
  networkPassphrase,
  amount,
  sendMemo,
  sendMemoType,
  receiverAddress,
}: SendPaymentProps) => {
  log.instruction({ title: "Sending Stellar payment to the receiving anchor" });

  const keypair = Keypair.fromSecret(secretKey);
  const server = new Server(networkUrl);
  const asset = new Asset(assetCode, assetIssuer);
  const account = await server.loadAccount(keypair.publicKey());

  const accountBalance = account.balances.find(
    (b: any) =>
      b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
  );

  if (!accountBalance) {
    throw new Error(
      `${assetCode} is not a trusted asset, a trusline must be added`,
    );
  }

  if (Number(accountBalance.balance) < Number(amount)) {
    throw new Error(
      `The sending anchor does not have enough ${assetCode} balance`,
    );
  }

  let memo;

  try {
    const memoType = {
      [MemoTypeString.TEXT]: Memo.text,
      [MemoTypeString.ID]: Memo.id,
      [MemoTypeString.HASH]: Memo.hash,
    }[sendMemoType];

    if (sendMemoType === MemoTypeString.HASH) {
      memo = memoType(Buffer.from(sendMemo, "base64").toString("hex"));
    } else {
      memo = memoType(sendMemo);
    }
  } catch (e) {
    throw new Error(
      `The memo \`${sendMemo}\` could not be encoded to type \`${sendMemoType}\``,
    );
  }

  const tx = new TransactionBuilder(new Account(keypair.publicKey(), "1"), {
    fee: (Number(BASE_FEE) * 5).toString(),
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: receiverAddress,
        amount,
        asset,
      }),
    )
    .addMemo(memo)
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  submitTransaction({ tx, server });
};

const submitTransaction = async ({ tx, server }: { tx: any; server: any }) => {
  let result;

  log.instruction({ title: "Submitting payment transaction" });

  try {
    result = await server.submitTransaction(tx);
  } catch (e) {
    const data = e.result.data;
    const status = data.status;
    const txStatus = data.extras.result_codes.transaction;
    const codes = data.extras.result_codes.operations;
    const codesList = codes ? codes.join(", ") : "";

    throw new Error(
      `Sending transaction failed with error code ${status}: ${txStatus}, ${codesList}`,
    );
  }

  log.instruction({ title: "Payment transaction submitted", body: result });

  return result;
};
