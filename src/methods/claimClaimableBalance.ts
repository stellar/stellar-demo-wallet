import { Account, Keypair, Operation, TransactionBuilder } from "stellar-sdk";
import { log } from "helpers/log";
import { CleanedClaimableBalanceRecord } from "types/types.d";

interface ClaimClaimableBalanceProps {
  secretKey: string;
  balance: CleanedClaimableBalanceRecord;
  assetCode: string;
  server: any;
  networkPassphrase: string;
  fee: string;
}

export const claimClaimableBalance = async ({
  secretKey,
  balance,
  assetCode,
  server,
  networkPassphrase,
  fee,
}: ClaimClaimableBalanceProps) => {
  log.instruction({
    title: `Claiming ${balance.amount} of ${assetCode}
    BalanceId: ${balance.id}
    Sponsor:${balance.sponsor}`,
  });

  try {
    const keypair = Keypair.fromSecret(secretKey);
    const accountRecord = await server
      .accounts()
      .accountId(keypair.publicKey())
      .call();

    log.instruction({
      title:
        "Loading account to get a sequence number for claimClaimableBalance transaction",
    });

    const account = new Account(keypair.publicKey(), accountRecord.sequence);
    log.instruction({ title: "Building claimClaimableBalance transaction" });

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
      url: "Submitting claimClaimableBalance transaction",
      body: transaction,
    });

    const result = await server.submitTransaction(transaction);
    log.response({
      url: "Submitted claimClaimableBalance transaction",
      body: result,
    });

    return result;
  } catch (error) {
    log.error({
      title: "claimClaimableBalance transaction failed",
      body: error.toString(),
    });
    throw new Error(error);
  }
};
