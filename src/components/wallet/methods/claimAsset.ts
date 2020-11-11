import {
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Keypair,
} from 'stellar-sdk'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function claimAsset(
  this: Wallet,
  balanceId: string,
  assetCode: string,
  sponsor: string,
  amount: string
) {
  const loadingKey = `claim:${assetCode}:${balanceId}`
  this.loading = { ...this.loading, [loadingKey]: true }
  const finish = () => (this.loading = { ...this.loading, [loadingKey]: false })

  try {
    this.logger.instruction(
      `Claiming ${amount} of ${assetCode}`,
      `BalanceId: ${balanceId} Sponsor:${sponsor}`
    )
    const keypair = Keypair.fromSecret(this.account.secretKey)
    const accountRecord = await this.server
      .accounts()
      .accountId(keypair.publicKey())
      .call()
    this.logger.instruction(
      'Loading account to get sequence number for claimClaimableBalance transaction'
    )
    const account = new Account(keypair.publicKey(), accountRecord.sequence)
    this.logger.instruction('Building claimClaimableBalance transaction')
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId,
        })
      )
      .setTimeout(0)
      .build()
    transaction.sign(keypair)
    this.logger.request('Submitting changeTrust transaction', transaction)
    const result = await this.server.submitTransaction(transaction)
    this.logger.response('Submitted claimClaimableBalance transaction', result)
    await this.updateAccount()
    finish()
  } catch (err) {
    this.logger.error(
      'Error in claimClaimableBalance transaction',
      err.toJSON()
    )
    this.error = handleError(err.response.data.extras.result_codes.operations)
    finish()
  }
}
