import { Server, StellarTomlResolver } from 'stellar-sdk'
import { handleError } from '@services/error'
import { get } from '@services/storage'

export default async function componentWillLoad() {
  try {
    let keystore = await get('keyStore')

    this.error = null
    this.server = new Server('https://horizon-testnet.stellar.org')
    this.homeDomain = 'testanchor.stellar.org'
    this.toml = await StellarTomlResolver.resolve(this.homeDomain)

    if (keystore) {
      keystore = atob(keystore)

      const { publicKey } = JSON.parse(atob(JSON.parse(keystore).adata))

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