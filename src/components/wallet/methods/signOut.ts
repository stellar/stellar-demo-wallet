import { remove } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function signOut(this: Wallet) {
  try {
    await this.setPrompt({
      message: 'You can press the back button to sign back in.',
      inputs: [], // No inputs, by default it displays an empty text field
    })

    // flush browser storage
    await remove('WALLET[keystore]')
    // remove secretKey param if present and reload
    location.assign(location.protocol + '//' + location.host)
  } catch (err) {
    this.error = handleError(err)
  }
}
