import {
  Account,
  TransactionBuilder,
  BASE_FEE,
  Operation,
  Keypair,
} from 'stellar-sdk'
import { get as loGet, findIndex as loFindIndex } from 'lodash-es'
import { handleError } from '@services/error'
import { ClaimableBalance } from '../views/claimableDisplay'
import { Wallet } from '../wallet'

export default async function claimAsset(
  this: Wallet,
  balance: ClaimableBalance
) {
  const balanceId = balance.id
  const assetCode =
    balance.asset === 'native' ? 'XLM' : balance.asset.split(':')[0]
  const loadingKey = `claim:${assetCode}:${balance.id}`
  this.loading = { ...this.loading, [loadingKey]: true }
  const finish = () => (this.loading = { ...this.loading, [loadingKey]: false })
  try {
    let [asset, issuer] = balance.asset.split(':')
    const balances = loGet(this.account, 'state.balances')
    const hasAsset = loFindIndex(balances, {
      asset_code: asset,
      asset_issuer: issuer,
    })
    if (hasAsset === -1) {
      await this.trustAsset(asset, issuer)
    }
    this.logger.instruction(
      `Claiming ${balance.amount} of ${assetCode}`,
      `BalanceId: ${balance.id} Sponsor:${balance.sponsor}`
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
      networkPassphrase: this.network_passphrase,
    })
      .addOperation(
        Operation.claimClaimableBalance({
          balanceId,
        })
      )
      .setTimeout(0)
      .build()
    transaction.sign(keypair)
    this.logger.request(
      'Submitting claimClaimableBalance transaction',
      transaction
    )
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
