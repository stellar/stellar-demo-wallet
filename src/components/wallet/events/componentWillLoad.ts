import { StellarTomlResolver } from 'stellar-sdk'
import { handleError } from '@services/error'
import { get } from '@services/storage'

export default async function componentWillLoad() {
  try {
    const publicKey = await get('WALLET[publicKey]')
    const keystore = await get('WALLET[keystore]')

    this.toml = await StellarTomlResolver.resolve(this.homeDomain)

    if (
      publicKey
      && keystore
    ) {
      this.account = {
        publicKey,
        keystore
      }

      this.updateAccount()
    }
  }

  catch (err) {
    this.error = handleError(err)
  }
}