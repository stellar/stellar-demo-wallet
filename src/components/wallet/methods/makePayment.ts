import sjcl from "@tinyanvil/sjcl";
import {
  Keypair,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
} from "stellar-sdk";
import { has as loHas } from "lodash-es";

import { handleError } from "@services/error";

export default async function makePayment(
  e?: Event,
  destination?: string,
  asset?: string,
  issuer?: string
) {
  try {
    if (e) e.preventDefault();

    let instructions;

    if (destination && asset) {
      instructions = await this.setPrompt(`How much ${asset} to pay?`);
      instructions = [instructions, asset, destination, issuer];
    } else {
      instructions = await this.setPrompt("{Amount} {Asset} {Destination}");
      instructions = instructions.split(" ");

      if (!/xlm/gi.test(instructions[1]))
        instructions[3] = await this.setPrompt(
          `Who issues the ${instructions[1]} asset?`,
          "Enter ME to refer to yourself"
        );
    }

    const pincode = await this.setPrompt("Enter your keystore pincode");

    if (!instructions || !pincode) return;

    const keypair = Keypair.fromSecret(
      sjcl.decrypt(pincode, this.account.keystore)
    );

    if (/me/gi.test(instructions[3])) instructions[3] = keypair.publicKey();

    this.error = null;
    this.loading = { ...this.loading, pay: true };

    await this.server
      .accounts()
      .accountId(keypair.publicKey())
      .call()
      .then(({ sequence }) => {
        const account = new Account(keypair.publicKey(), sequence);
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.payment({
              destination: instructions[2],
              asset: instructions[3]
                ? new Asset(instructions[1], instructions[3])
                : Asset.native(),
              amount: instructions[0],
            })
          )
          .setTimeout(0)
          .build();

        transaction.sign(keypair);
        return this.server.submitTransaction(transaction).catch((err) => {
          if (
            // Paying an account which doesn't exist, create it instead
            loHas(err, "response.data.extras.result_codes.operations") &&
            err.response.data.status === 400 &&
            err.response.data.extras.result_codes.operations.indexOf(
              "op_no_destination"
            ) !== -1 &&
            !instructions[3]
          ) {
            const transaction = new TransactionBuilder(account, {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET,
            })
              .addOperation(
                Operation.createAccount({
                  destination: instructions[2],
                  startingBalance: instructions[0],
                })
              )
              .setTimeout(0)
              .build();

            transaction.sign(keypair);
            return this.server.submitTransaction(transaction);
          } else throw err;
        });
      })
      .then((res) => console.log(res))
      .finally(() => {
        this.loading = { ...this.loading, pay: false };
        this.updateAccount();
      });
  } catch (err) {
    this.error = handleError(err);
  }
}
