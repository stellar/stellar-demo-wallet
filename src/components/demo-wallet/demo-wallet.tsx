import { Component, State, Host, h, Prop } from '@stencil/core'
import copy from 'copy-to-clipboard'
import sjcl from 'sjcl'
import axios from 'axios'
import { get, set } from "../../services/storage"
import { Prompt } from '../prompt-modal/prompt-modal'
import { Keypair, Server, Account, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } from 'stellar-sdk'

interface StellarAccount {
  publicKey: string,
  keystore: string,
  state?: object
}

@Component({
  tag: 'stellar-demo-wallet',
  styleUrl: 'demo-wallet.scss',
  shadow: true
})
export class DemoWallet {
  @State() account: StellarAccount
  @State() prompt: Prompt = {show: false}

  @Prop() server: Server

  async componentWillLoad() {
    let keystore = await get('keyStore')

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
  }

  async createAccount(e: Event) {
    e.preventDefault()

    const pincode = await this.setPrompt('Enter a keystore pincode')

    if (!pincode)
      return

    const keypair = Keypair.random()

    await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)

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

  async makePayment(e: Event) {
    e.preventDefault()

    let instructions

    instructions = await this.setPrompt('{Amount} {Destination}')
    instructions = instructions.split(' ')

    const pincode = await this.setPrompt('Enter your keystore pincode')

    if (
      !instructions
      || !pincode
    ) return

    const keypair = Keypair.fromSecret(
      sjcl.decrypt(pincode, this.account.keystore)
    )

    return this.server
    .accounts()
    .accountId(keypair.publicKey())
    .call()
    .then(({sequence}) => {
      const account = new Account(keypair.publicKey(), sequence)
      const transaction = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
      .addOperation(Operation.payment({
        destination: instructions[1],
        asset: Asset.native(),
        amount: instructions[0]
      }))
      .setTimeout(0)
      .build()

      transaction.sign(keypair)
      return this.server.submitTransaction(transaction)
    })
    .then((res) => console.log(res))
    .catch((err) => console.error(err))
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
  ): Promise<string> {
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
              // <button type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>
              <button type="button" onClick={(e) => this.makePayment(e)}>Make Payment</button>
            ] 
            : <button type="button" onClick={(e) => this.createAccount(e)}>Create Account</button>
          }
        </form>
      </Host>
    )
  }
}
