import {
  Keypair,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset
} from 'stellar-sdk'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'

export default async function trustAsset(
  e?: Event,
  asset?: string,
  issuer?: string,
  pincode_stretched?: Uint8Array
) {
  try {
    if (e)
      e.preventDefault()

    let instructions

    if (
      asset
      && issuer
    ) instructions = [asset, issuer]

    else {
      instructions = await this.setPrompt('{Asset} {Issuer}')
      instructions = instructions.split(' ')
    }

    if (!pincode_stretched) {
      const pincode = await this.setPrompt('Enter your keystore pincode')
      pincode_stretched = await stretchPincode(pincode, this.account.publicKey)
    }

    const keypair = Keypair.fromSecret(
      decrypt(
        this.account.keystore,
        this.account.publicKey,
        pincode_stretched
      )
    )

    this.error = null
    this.loading = {...this.loading, trust: true}

    await this.server.accounts()
    .accountId(keypair.publicKey())
    .call()
    .then(({sequence}) => {
      const account = new Account(keypair.publicKey(), sequence)
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(Operation.changeTrust({
        asset: new Asset(instructions[0], instructions[1])
      }))
      .setTimeout(0)
      .build()

      transaction.sign(keypair)
      return this.server.submitTransaction(transaction)
    })
    .then((res) => console.log(res))
    .finally(() => {
      this.loading = {...this.loading, trust: false}
      this.updateAccount()
    })
  }

  catch (err) {
    this.error = handleError(err)
    throw err
  }
}