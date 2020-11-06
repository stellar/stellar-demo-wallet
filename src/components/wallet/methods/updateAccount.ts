import {
  omit as loOmit,
  // find as loFind,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

async function claimableBalanceQuery(wallet: Wallet) {
  let resp = await wallet.server
    .claimableBalances()
    .claimant(wallet.account.publicKey)
    .call()
  resp.records.forEach((record) => {
    wallet.logger.response(
      'Claimable Balances Available ',
      loOmit(record, ['_links', 'paging_token', 'self'])
    )
  })
}

export default async function updateAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }
    let account = await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
    this.account = {
      ...this.account,
      state: loOmit(account, ['id', '_links', 'account_id', 'paging_token']),
    }
    await claimableBalanceQuery(this)
    this.loading = { ...this.loading, update: false }
  } catch (err) {
    this.error = handleError(err)
  }
}
