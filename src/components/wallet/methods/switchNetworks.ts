import { remove } from '@services/storage'
import { Wallet } from '../wallet'
import { Networks } from 'stellar-sdk'
import { handleError } from '@services/error'

export default async function switchNetworks(
  this: Wallet,
  { loggedIn }: { loggedIn: boolean }
) {
  try {
    if (loggedIn) {
      await this.setPrompt({
        message: 'You will be signed out, but you can always press back.',
        inputs: [], // No inputs, by default it displays an empty text field
      })
      // flush browser storage
      await remove('WALLET[keystore]')
    }

    // remove secretKey param if present and reload
    let baseURL = location.protocol + '//' + location.host
    let query = ''
    if (this.network_passphrase === Networks.TESTNET) {
      query = '?pubnet=true'
    }
    // reloads the app with the new URL
    // this will trigger componentWillLoad()
    // which will update this.network_passphrase & this.server
    location.assign(baseURL + query)
  } catch (err) {
    this.error = handleError(err)
  }
}
