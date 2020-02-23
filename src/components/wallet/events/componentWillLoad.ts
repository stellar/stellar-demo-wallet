import { StellarTomlResolver } from 'stellar-sdk'
import { handleError } from '@services/error'
import { get } from '@services/storage'

export default async function componentWillLoad() {
  try {
    const keystore = await get('WALLET[keystore]')

    this.toml = await StellarTomlResolver.resolve(this.homeDomain)

    if (keystore) {
      this.account = {...JSON.parse(atob(keystore))}
      this.updateAccount()
    }
  }

  catch (err) {
    this.error = handleError(err)
  }
}