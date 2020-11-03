import {
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Keypair,
} from 'stellar-sdk'
import { has as loHas } from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function makePayment(
  this: Wallet,
  destination?: string,
  assetCode?: string,
  issuer?: string
) {
  try {
    if (!destination)
      destination = await this.setPrompt({ message: 'Destination address' })

    if (!assetCode || (!issuer && assetCode !== 'XLM')) {
      const assetAndIssuer = await this.setPrompt({
        message: '{Asset} {Issuer} (leave empty for XLM)',
      })

      if (assetAndIssuer === '') assetCode = 'XLM'
      else [assetCode, issuer] = assetAndIssuer.split(' ')
    }

    const amount = await this.setPrompt({
      message: `How much ${assetCode} to pay?`,
    })

    const keypair = Keypair.fromSecret(this.account.secretKey)

    this.error = null
    const loadingKey = `send:${assetCode}:${issuer}`
    this.loading = { ...this.loading, [loadingKey]: true }
    const asset =
      assetCode === 'XLM' ? Asset.native() : new Asset(assetCode, issuer)

    await this.server
      .accounts()
      .accountId(keypair.publicKey())
      .call()
      .then(({ sequence }) => {
        const account = new Account(keypair.publicKey(), sequence)
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET,
        })
          .addOperation(
            Operation.payment({
              destination,
              asset,
              amount,
            })
          )
          .setTimeout(0)
          .build()

        transaction.sign(keypair)
        return this.server.submitTransaction(transaction).catch((err) => {
          if (
            // Paying an account which doesn't exist, create it instead
            loHas(err, 'response.data.extras.result_codes.operations') &&
            err.response.data.status === 400 &&
            err.response.data.extras.result_codes.operations.indexOf(
              'op_no_destination'
            ) !== -1 &&
            !issuer
          ) {
            const transaction = new TransactionBuilder(account, {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET,
            })
              .addOperation(
                Operation.createAccount({
                  destination,
                  startingBalance: amount,
                })
              )
              .setTimeout(0)
              .build()

            transaction.sign(keypair)
            return this.server.submitTransaction(transaction)
          } else throw err
        })
      })
      .then((res) => console.log(res))
      .finally(() => {
        this.loading = { ...this.loading, [loadingKey]: false }
        this.updateAccount()
      })
  } catch (err) {
    this.error = handleError(err)
  }
}
