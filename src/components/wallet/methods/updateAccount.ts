import {
  omit as loOmit,
  // find as loFind,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function updateAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }
    let account = await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
    let claimableBalanceResp = await this.server
      .claimableBalances()
      .claimant(this.account.publicKey)
      .call()
    claimableBalanceResp.records.forEach((record) => {
      this.logger.response(
        'Claimable Balances Available ',
        loOmit(record, ['_links', 'paging_token', 'self'])
      )
    })
    this.account = {
      ...this.account,
      state: loOmit(account, ['id', '_links', 'account_id', 'paging_token']),
      claimableBalances: loOmit(claimableBalanceResp),
    }
    account.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        this.assets.set({ code: 'XLM' }, {})
        return
      }
      if (!this.assets.get({ code: b.asset_code, issuer: b.asset_issuer }))
        this.assets.set({ code: b.asset_code, issuer: b.asset_issuer }, {})
    })
    this.loading = { ...this.loading, update: false }
  } catch (err) {
    this.error = handleError(err)
  }
}
