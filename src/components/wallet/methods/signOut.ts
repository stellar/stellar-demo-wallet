import { remove } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'
import { PromptInput } from '../../prompt/promptInput'

export default async function signOut(this: Wallet) {
  try {
    const inputs = await this.setPrompt({
      message: 'Are you sure? This will nuke your account',
      inputs: [new PromptInput('Enter NUKE to confirm')],
    })
    const confirmNuke = inputs[0].value

    if (!confirm || !/nuke/gi.test(confirmNuke)) throw 'Cannot sign out'

    this.error = null

    await remove('WALLET[keystore]')
    location.reload()
  } catch (err) {
    this.error = handleError(err)
  }
}
