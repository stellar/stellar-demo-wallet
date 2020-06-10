import {
  omit as loOmit,
  map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'

export default async function updateAccount() {
  try {
    this.error = null
    this.loading = {...this.loading, update: true}

    await this.server
    .accounts()
    .accountId(this.account.publicKey)
    .call()
    .then((account) => {
      account.balances = loMap(account.balances, (balance) => loOmit(balance, [
        'limit',
        'buying_liabilities',
        'selling_liabilities',
        'is_authorized',
        'last_modified_ledger',
        balance.asset_type !== 'native' ? 'asset_type' : null
      ]))

      this.account = {...this.account, state: loOmit(account, [
        'id',
        '_links',
        'sequence',
        'subentry_count',
        'last_modified_ledger',
        'flags',
        'thresholds',
        'account_id',
        'signers',
        'paging_token',
        'data_attr'
      ])}
    })
    .finally(() => this.loading = {...this.loading, update: false})
  }

  catch (err) {
    this.error = handleError(err)
  }
}