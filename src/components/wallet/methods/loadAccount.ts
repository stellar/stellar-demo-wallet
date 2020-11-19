import { Keypair, Networks } from 'stellar-sdk'
import { set } from '@services/storage'
import { handleError } from '@services/error'
import { Wallet } from '../wallet'

export default async function loadAccount(
  this: Wallet,
  { displayPrompt }: { displayPrompt?: boolean } = {}
) {
  try {
    let inputs
    let secret
    if (displayPrompt || !this.account.secretKey) {
      inputs = await this.setPrompt({
        message: 'Enter your Stellar secret key',
      })
      secret = inputs[0].value
    } else {
      secret = this.account.secretKey
    }

    let keypair
    try {
      keypair = Keypair.fromSecret(secret)
    } catch (e) {
      throw 'Invalid secret key'
    }

    let accountRecord = await this.server
      .accounts()
      .accountId(keypair.publicKey())
      .call()
    accountRecord.balances.forEach((b) => {
      if (b.asset_type === 'native') {
        this.assets.set('XLM', {})
        return
      }
      this.assets.set(`${b.asset_code}:${b.asset_issuer}`, {})
    })

    this.account = {
      ...this.account,
      publicKey: keypair.publicKey(),
      secretKey: keypair.secret(),
    }

    set('WALLET[keystore]', btoa(JSON.stringify(this.account)))

    await this.updateAccount()
    let query = `?secretKey=${this.account.secretKey}`
    if (this.network_passphrase === Networks.PUBLIC) {
      query += `&pubnet=true`
    }
    history.replaceState(null, '', query)
  } catch (err) {
    this.error = handleError(err)
  }
}
