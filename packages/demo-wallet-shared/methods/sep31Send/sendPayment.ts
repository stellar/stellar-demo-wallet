import { getCatchError } from "@stellar/frontend-helpers";
import {
  Account,
  Asset,
  Keypair,
  Memo,
  Operation,
  Horizon,
  TransactionBuilder,
} from "stellar-sdk";
import { log } from "../../helpers/log";
import { MemoTypeString } from "../../types/types";
import {getNetworkConfig} from "../../helpers/getNetworkConfig";

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

interface SendPaymentError extends Error {
  result?: {
    data: {
      status: string;
      extras: {
        // eslint-disable-next-line camelcase
        result_codes: {
          transaction: string;
          operations: string[];
        };
      };
    };
  };
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
  const server = new Horizon.Server(networkUrl);
  const asset = new Asset(assetCode, assetIssuer);
  const publicKey = keypair.publicKey();
  const account = await server.loadAccount(publicKey);
  const { sequence } = await server.accounts().accountId(publicKey).call();

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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      [MemoTypeString.TEXT]: Memo.text,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      [MemoTypeString.ID]: Memo.id,
      // eslint-disable-next-line @typescript-eslint/unbound-method
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

  const tx = new TransactionBuilder(new Account(publicKey, sequence), {
    fee: (Number(getNetworkConfig().baseFee) * 5).toString(),
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
    const error: SendPaymentError = getCatchError(e);
    const data = error?.result?.data;
    const status = data?.status;
    const txStatus = data?.extras.result_codes.transaction;
    const codes = data?.extras.result_codes.operations;
    const codesList = codes ? codes.join(", ") : "";

    throw new Error(
      `Sending transaction failed with error code ${status}: ${txStatus}, ${codesList}`,
    );
  }

  log.instruction({ title: "Payment transaction submitted", body: result });

  return result;
};
