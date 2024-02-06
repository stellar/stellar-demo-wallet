import {
  TransactionBuilder,
  Operation,
  Asset,
  Keypair,
  Horizon,
} from "stellar-sdk";
import { getErrorMessage } from "../helpers/getErrorMessage";
import { log } from "../helpers/log";
import { TrustAssetParam } from "../types/types";
import {getNetworkConfig} from "../helpers/getNetworkConfig";

export const trustAsset = async ({
  secretKey,
  untrustedAsset,
  networkUrl,
  networkPassphrase,
}: {
  secretKey: string;
  untrustedAsset: TrustAssetParam;
  networkUrl: string;
  networkPassphrase: string;
}) => {
  try {
    log.instruction({
      title: `Adding \`${untrustedAsset.assetCode}:${untrustedAsset.assetIssuer}\` trustline`,
    });
    const keypair = Keypair.fromSecret(secretKey);
    const server = new Horizon.Server(networkUrl);

    log.instruction({
      title:
        "Loading account to get a sequence number for add trustline transaction",
    });
    const account = await server.loadAccount(keypair.publicKey());

    log.instruction({ title: "Building add trustline transaction" });
    const transaction = new TransactionBuilder(account, {
      fee: getNetworkConfig().baseFee,
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
      title: "Submitting add trustline transaction",
      body: transaction,
    });
    const result = await server.submitTransaction(transaction);

    log.response({
      title: "Submitted add trustline transaction",
      body: result,
    });
    log.instruction({
      title: `Asset \`${untrustedAsset.assetCode}:${untrustedAsset.assetIssuer}\` trustline added`,
    });

    return result;
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    log.error({
      title: "Add trustline transaction failed",
      body: errorMessage,
    });
    throw new Error(errorMessage);
  }
};
