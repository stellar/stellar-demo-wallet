import copy from 'copy-to-clipboard'

import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function copySecret(this: Wallet) {
  try {
    copy(this.account.secretKey)
  } catch (err) {
    this.error = handleError(err)
  }
}
