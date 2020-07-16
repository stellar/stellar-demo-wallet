import {
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
  this.loading = { ...this.loading, trust: true }
  this.error = null
  console.log(this.loading)
  const finish = () => (this.loading = { ...this.loading, trust: false })
  try {
    if (!asset || !issuer) {
      let instructions = await this.setPrompt({ message: '{Asset} {Issuer}' })
      ;[asset, issuer] = instructions.split(' ')
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

    this.logger.instruction(
      'Loading account to get sequence number for trust transaction'
    )
    const account = await this.server.loadAccount(keypair.publicKey())

    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.changeTrust({
          asset: new Asset(asset, issuer),
        })
      )
      .setTimeout(0)
      .build()

    transaction.sign(keypair)
    this.logger.request('Submitting changeTrust transaction', transaction)
    const result = await this.server.submitTransaction(transaction)
    this.logger.response('Submitted changeTrust transaction', result)
    await this.updateAccount()
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in trust transaction', err)
    finish()
    throw err
  }
}
