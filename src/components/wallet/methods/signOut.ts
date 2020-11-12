import { remove } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function signOut(this: Wallet) {
  try {
    // flush browser storage
    await remove('WALLET[keystore]')
    // remove secretKey param if present and reload
    location.assign(location.protocol + '//' + location.host)
  } catch (err) {
    this.error = handleError(err)
  }
}
