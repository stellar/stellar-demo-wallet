import { Server } from 'stellar-sdk'
import { handleError } from '@services/error'
import { get } from '@services/storage'

export default async function componentWillLoad() {
  try {
    let keystore = await get('keyStore')

    this.error = null
    this.server = new Server('https://horizon-testnet.stellar.org')

    if (!keystore)
      return
    else
      keystore = atob(keystore)

    const { publicKey } = JSON.parse(atob(JSON.parse(keystore).adata))

    this.account = {
      publicKey,
      keystore
    }

    this.updateAccount()
  }

  catch (err) {
    this.error = handleError(err)
  }
}