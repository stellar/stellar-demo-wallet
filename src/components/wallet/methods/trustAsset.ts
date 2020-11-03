import {
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset,
  Keypair,
} from 'stellar-sdk'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function trustAsset(
  this: Wallet,
  asset?: string,
  issuer?: string
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

    const keypair = Keypair.fromSecret(this.account.secretKey)

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
