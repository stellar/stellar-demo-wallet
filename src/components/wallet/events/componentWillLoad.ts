import { handleError } from '@services/error'
import { get } from '@services/storage'
import { Wallet, WalletAsset } from '../wallet'

export default async function componentWillLoad(this: Wallet) {
  try {
    const keystore = await get('WALLET[keystore]')
    if (keystore) {
      this.account = { ...JSON.parse(atob(keystore)) }
      this.updateAccount()
    }
  } catch (err) {
    this.error = handleError(err)
  }
}
