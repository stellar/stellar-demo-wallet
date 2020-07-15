import {
  omit as loOmit,
  find as loFind,
  // map as loMap
} from 'lodash-es'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function updateAccount(this: Wallet) {
  try {
    this.error = null
    this.loading = { ...this.loading, update: true }
    // this.logger.instruction('Updating account...')
    await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
      .then((account) => {
        // const selfURL = loFind(account, 'self')
        // this.logger.request(selfURL.self.href)

        this.account = {
          ...this.account,
          state: loOmit(account, [
            'id',
            '_links',
            'account_id',
            'paging_token',
          ]),
        }
        // this.logger.response(selfURL.self.href, account)
      })
      .finally(() => (this.loading = { ...this.loading, update: false }))
  } catch (err) {
    this.error = handleError(err)
  }
}
