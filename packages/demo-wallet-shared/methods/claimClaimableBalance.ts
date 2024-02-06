import {
  Account,
  Keypair,
  Operation,
  TransactionBuilder,
  Horizon,
} from "stellar-sdk";
import { getErrorMessage } from "../helpers/getErrorMessage";
import { log } from "../helpers/log";
import { ClaimableAsset } from "../types/types";

interface ClaimClaimableBalanceProps {
  secretKey: string;
  balance: ClaimableAsset;
  assetCode: string;
  networkPassphrase: string;
  networkUrl: string;
  fee: string;
}

export const claimClaimableBalance = async ({
  secretKey,
  balance,
  assetCode,
  networkPassphrase,
  networkUrl,
  fee,
}: ClaimClaimableBalanceProps) => {
  log.instruction({
    title: `Claiming ${balance.total} ${assetCode}`,
    body: `Balance ID: ${balance.id}, sponsor: ${balance.sponsor}`,
  });

  try {
    const keypair = Keypair.fromSecret(secretKey);
    const server = new Horizon.Server(networkUrl);
    const accountRecord = await server
      .accounts()
      .accountId(keypair.publicKey())
      .call();

    log.instruction({
      title:
        "Loading account to get a sequence number for `claimClaimableBalance` transaction",
    });

    const account = new Account(keypair.publicKey(), accountRecord.sequence);
    log.instruction({ title: "Building `claimClaimableBalance` transaction" });

    const transaction = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId: balance.id,
        }),
      )
      .setTimeout(0)
      .build();

    transaction.sign(keypair);

    log.request({
      title: "Submitting `claimClaimableBalance` transaction",
      body: transaction,
    });

    const result = await server.submitTransaction(transaction);
    log.response({
      title: "Submitted `claimClaimableBalance` transaction",
      body: result,
    });
    log.instruction({ title: `Claimed ${balance.total} ${assetCode}` });

    return result;
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    log.error({
      title: "`claimClaimableBalance` transaction failed",
      body: errorMessage,
    });
    throw new Error(errorMessage);
  }
};
