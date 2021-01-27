import {
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Keypair,
} from "stellar-sdk";
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
  // TODO: add logs
  try {
    console.log("trust asset started");
    const keypair = Keypair.fromSecret(secretKey);
    const account = await server.loadAccount(keypair.publicKey());
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

    return await server.submitTransaction(transaction);
  } catch (error) {
    throw new Error(error);
  }
};
