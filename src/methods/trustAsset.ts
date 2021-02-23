import {
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Keypair,
} from "stellar-sdk";
import { log } from "helpers/log";
import { TrustAssetParam } from "types/types.d";

export const trustAsset = async ({
  server,
  secretKey,
  untrustedAsset,
  networkPassphrase,
}: {
  server: any;
  secretKey: string;
  untrustedAsset: TrustAssetParam;
  networkPassphrase: string;
}) => {
  try {
    log.instruction({ title: "Adding trustline…" });
    const keypair = Keypair.fromSecret(secretKey);

    log.instruction({
      title:
        "Loading account to get a sequence number for add trustline transaction",
    });
    const account = await server.loadAccount(keypair.publicKey());

    log.instruction({ title: "Building add trustline transaction…" });
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(
            untrustedAsset.assetCode,
            untrustedAsset.assetIssuer,
          ),
        }),
      )
      .setTimeout(0)
      .build();

    transaction.sign(keypair);

    log.request({
      title: "Submitting add trustline transaction…",
      body: transaction,
    });
    const result = await server.submitTransaction(transaction);

    log.response({
      title: "Submitted add trustline transaction",
      body: result,
    });

    return result;
  } catch (error) {
    log.error({
      title: "Add trustline transaction failed",
      body: error.toString(),
    });
    throw new Error(error);
  }
};
