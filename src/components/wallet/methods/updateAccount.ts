import {
  omit as loOmit,
  // find as loFind,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export function claimableBalanceQuery({ this: wallet }) {
  wallet.server
    .claimableBalances()
    .claimant(wallet.account.publicKey)
    .call()
    .then(function (resp) {
      resp.records.forEach((record) => {
        wallet.logger.response(
          'Claimable Balances Available ',
          loOmit(record, ['_links', 'paging_token', 'self'])
        )
      })
      console.log(resp)
    })
    .catch(function (err) {
      wallet.error = handleError(err)
      console.error(err)
    })
  wallet.loading = { ...wallet.loading, update: false }
}

export default async function updateAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }
    await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
      .then((account) => {
        this.account = {
          ...this.account,
          state: loOmit(account, [
            'id',
            '_links',
            'account_id',
            'paging_token',
          ]),
        }
      })
      .finally(() => claimableBalanceQuery({ this: this }))
  } catch (err) {
    this.error = handleError(err)
  }
}
