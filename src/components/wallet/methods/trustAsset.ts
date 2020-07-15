import {
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
} from 'stellar-sdk'

import { handleError } from '@services/error'
import { stretchPincode } from '@services/argon2'
import { decrypt } from '@services/tweetnacl'
import { Wallet } from '../wallet'

export default async function trustAsset(
  this: Wallet,
  asset?: string,
  issuer?: string,
  pincode_stretched?: Uint8Array
) {
  try {
    let instructions

    this.logger.instruction(
      'We need to add a trustline to the asset to ensure the deposit will be expected'
    )

    if (asset && issuer) {
      instructions = [asset, issuer]
      this.logger.instruction(
        'There is already a trustline on this account, no need to recreate it'
      )
    } else {
      this.logger.instruction(
        'There isn’t currently a trustline on this account so we need to add one'
      )
      instructions = await this.setPrompt({ message: '{Asset} {Issuer}' })
      instructions = instructions.split(' ')
    }

    if (!pincode_stretched) {
      const pincode = await this.setPrompt({
        message: 'Enter your account pincode',
        type: 'password',
      })
      pincode_stretched = await stretchPincode(pincode, this.account.publicKey)
    }

    const keypair = decrypt(
      this.account.cipher,
      this.account.nonce,
      pincode_stretched
    )

    this.error = null
    this.loading = { ...this.loading, trust: true }

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
            Operation.changeTrust({
              asset: new Asset(instructions[0], instructions[1]),
            })
          )
          .setTimeout(0)
          .build()

        transaction.sign(keypair)
        return this.server.submitTransaction(transaction)
      })
      .then((res) => console.log(res))
      .finally(() => {
        this.loading = { ...this.loading, trust: false }
        this.updateAccount()
      })
  } catch (err) {
    this.error = handleError(err)
    throw err
  }
}
