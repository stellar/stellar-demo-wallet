import sjcl from '@tinyanvil/sjcl'
import {
  Keypair,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset
} from 'stellar-sdk'
import { has as loHas } from 'lodash-es'

import { handleError } from '@services/error'

export default async function makePayment(e: Event) {
  try {
    e.preventDefault()

    let instructions = await this.setPrompt('{Amount} {Destination}')
        instructions = instructions.split(' ')

    const pincode = await this.setPrompt('Enter your keystore pincode')

    if (
      !instructions
      || !pincode
    ) return

    const keypair = Keypair.fromSecret(
      sjcl.decrypt(pincode, this.account.keystore)
    )

    this.error = null
    this.loading = {...this.loading, pay: true}

    await this.server
    .accounts()
    .accountId(keypair.publicKey())
    .call()
    .then(({sequence}) => {
      const account = new Account(keypair.publicKey(), sequence)
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(Operation.payment({
        destination: instructions[1],
        asset: Asset.native(),
        amount: instructions[0]
      }))
      .setTimeout(0)
      .build()

      transaction.sign(keypair)
      return this.server.submitTransaction(transaction)
      .catch((err) => {
        if ( // Paying an account which doesn't exist, create it instead
          loHas(err, 'response.data.extras.result_codes.operations')
          && err.response.data.status === 400
          && err.response.data.extras.result_codes.operations.indexOf('op_no_destination') !== -1
        ) {
          const transaction = new TransactionBuilder(account, {
            fee: BASE_FEE,
            networkPassphrase: Networks.TESTNET
          })
          .addOperation(Operation.createAccount({
            destination: instructions[1],
            startingBalance: instructions[0]
          }))
          .setTimeout(0)
          .build()

          transaction.sign(keypair)
          return this.server.submitTransaction(transaction)
        }

        else throw err
      })
    })
    .then((res) => console.log(res))
    .finally(() => {
      this.loading = {...this.loading, pay: false}
      this.updateAccount()
    })
  }

  catch (err) {
    this.error = handleError(err)
  }
}