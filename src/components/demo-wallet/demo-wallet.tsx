import { Component, State, Host, h } from '@stencil/core'
import copy from 'copy-to-clipboard'
import sjcl from 'sjcl'
import { get, set } from "../../services/storage";
import { Prompt } from '../prompt-modal/prompt-modal'
import { Keypair } from '@tinyanvil/stellar-sdk/dist/stellar-sdk-common.min'

interface Account {
  publicKey: string,
  keystore: string
}

@Component({
  tag: 'stellar-demo-wallet',
  styleUrl: 'demo-wallet.scss',
  shadow: true
})
export class DemoWallet {
  @State() account: Account
  @State() prompt: Prompt = {show: false}

  async componentWillLoad() {
    let keystore = await get('keyStore')

    if (!keystore)
      return
    else
      keystore = atob(keystore)

    const { publicKey } = JSON.parse(atob(JSON.parse(keystore).adata))

    this.account = {
      publicKey,
      keystore
    }
  }

  async createAccount(e: Event) {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter a keystore pincode')

    if (!pincode)
      return

    const keypair = Keypair.random()

    this.account = {
      publicKey: keypair.publicKey(),
      keystore: sjcl.encrypt(pincode, keypair.secret(), {
        adata: JSON.stringify({
          publicKey: keypair.publicKey()
        })
      })
    }
    
    await set('keyStore', btoa(this.account.keystore))
  }

  async copySecret(e: Event) {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter your keystore pincode')

    if (!pincode)
      return

    const secret = sjcl.decrypt(pincode, this.account.keystore)
    copy(secret)
  }

  setPrompt(
    message: string = null,
    placeholder: string = null
  ) {
    this.prompt = {
      ...this.prompt, 
      show: true,
      message,
      placeholder
    }

    return new Promise((resolve, reject) => { 
      this.prompt.resolve = resolve
      this.prompt.reject = reject
    })
  }

  render() {
    return (
      <Host>
        <stellar-prompt-modal prompt={this.prompt} />
        <form>
          {
            this.account 
            ? [
              <p>{this.account.publicKey}</p>,
              <button type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>
            ] 
            : <button type="button" onClick={(e) => this.createAccount(e)}>Create Account</button>
          }
        </form>
      </Host>
    )
  }
}
