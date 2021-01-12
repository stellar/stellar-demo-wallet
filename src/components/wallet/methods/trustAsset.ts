import {
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Asset,
  Keypair,
} from 'stellar-sdk'
import getAssetAndIssuer from './getAssetIssuer'
import { handleError } from '@services/error'
import { set } from '@services/storage'
import { Wallet } from '../wallet'
export default async function trustAsset(
  this: Wallet,
  asset?: string,
  issuer?: string
) {
  this.loading = { ...this.loading, trust: true }
  this.error = null
  const finish = () => (this.loading = { ...this.loading, trust: false })
  try {
    if (!asset || !issuer) {
      let nullOrData = await getAssetAndIssuer(this)
      if (!nullOrData) {
        finish()
        return nullOrData
      }
      ;[asset, issuer] = nullOrData
    }
    this.logger.instruction(
      'Loading account to get sequence number for trust transaction'
    )
    const keypair = Keypair.fromSecret(this.account.secretKey)
    const account = await this.server.loadAccount(keypair.publicKey())
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.network_passphrase,
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
    // update the balance prop with the new asset we added
    if (this.balance.has(`${asset}:${issuer}`)) {
      this.balance.delete(`${asset}:${issuer}`)
    }
    set(
      'BALANCE[keystore]',
      btoa(JSON.stringify(Array.from(this.balance.entries())))
    )
    await this.updateAccount()
    finish()
  } catch (err) {
    this.error = handleError(err)
    this.logger.error('Error in trust transaction', err)
    finish()
    throw err
  }
}
