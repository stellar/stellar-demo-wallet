import { StellarTomlResolver } from 'stellar-sdk'
import { handleError } from '@services/error'
import { get } from '@services/storage'

export default async function componentWillLoad() {
  try {
    const keystore = await get('WALLET[keystore]')

    this.toml = await StellarTomlResolver.resolve(this.homeDomain)

    if (keystore) {
      const {publicKey, cipher} = JSON.parse(atob(keystore))

      this.account = {
        publicKey,
        cipher
      }

      this.updateAccount()
    }
  }

  catch (err) {
    this.error = handleError(err)
  }
}