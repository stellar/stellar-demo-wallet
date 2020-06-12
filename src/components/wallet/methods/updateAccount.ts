import {
  omit as loOmit,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'

export default async function updateAccount() {
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
      .finally(() => (this.loading = { ...this.loading, update: false }))
  } catch (err) {
    this.error = handleError(err)
  }
}
