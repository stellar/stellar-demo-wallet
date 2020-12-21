import {
  omit as loOmit,
  // find as loFind,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'
import { get } from '@services/storage'
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
      claimableBalances: claimableBalanceResp.records,
    }
    const balKeystore = await get('BALANCE[keystore]')
    // this restores the balance prop from storage
    if (balKeystore && !this.balance.size) {
      JSON.parse(atob(balKeystore)).forEach((b) => {
        this.balance.set(b[0], b[1])
      })
    }
    account.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        this.assets.set('XLM', {})
        this.balance.set('XLM', {
          asset_code: 'XLM',
          asset_type: b.asset_type,
          balance: b.balance,
          is_authorized: null,
          asset_issuer: null,
        })
        return
      }
      if (!this.assets.get(`${b.asset_code}:${b.asset_issuer}`))
        this.assets.set(`${b.asset_code}:${b.asset_issuer}`, {})
      this.balance.set(`${b.asset_code}:${b.asset_issuer}`, {
        asset_code: b.asset_code,
        asset_issuer: b.asset_issuer,
        balance: b.balance,
        asset_type: b.asset_type,
        is_authorized: b.is_authorized,
      })
    })
    this.loading = { ...this.loading, update: false }
  } catch (err) {
    this.error = handleError(err)
  }
}
