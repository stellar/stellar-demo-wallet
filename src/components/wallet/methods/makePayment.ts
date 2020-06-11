import {
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
} from 'stellar-sdk'
import { has as loHas } from 'lodash-es'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'

export default async function makePayment(
  destination?: string,
  assetCode?: string,
  issuer?: string
) {
  try {
    if (!destination) {
      destination = await this.setPrompt({ message: 'Destination address' })
    }

    if (!assetCode || (!issuer && assetCode != 'XLM')) {
      const assetAndIssuer = await this.setPrompt({
        message: '{Asset} {Issuer} (leave empty for XLM)',
      })
      if (assetAndIssuer === '') {
        assetCode = 'XLM'
      } else {
        ;[assetCode, issuer] = assetAndIssuer.split(' ')
      }
    }

    const amount = await this.setPrompt({
      message: `How much ${assetCode} to pay?`,
    })

    const pincode = await this.setPrompt({
      message: 'Enter your account pincode',
      type: 'password',
    })
    const pincode_stretched = await stretchPincode(
      pincode,
      this.account.publicKey
    )

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    this.error = null
    this.loading = { ...this.loading, pay: true }

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
        this.loading = { ...this.loading, pay: false }
        this.updateAccount()
      })
  } catch (err) {
    this.error = handleError(err)
  }
}
