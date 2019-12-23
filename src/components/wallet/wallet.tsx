import { Component, State, h, Prop } from '@stencil/core'
import copy from 'copy-to-clipboard'
import sjcl from 'sjcl'
import axios from 'axios'
import { get, set } from "../../services/storage"
import { Prompter } from '../prompt/prompt'
import { Keypair, Server, ServerApi, Account, TransactionBuilder, BASE_FEE, Networks, Operation, Asset } from 'stellar-sdk'
import { get as loGet } from 'lodash-es'

interface StellarAccount {
  publicKey: string,
  keystore: string,
  state?: ServerApi.AccountRecord
}

interface Loading {
  fund?: boolean,
  pay?: boolean,
  update?: boolean,
}

@Component({
  tag: 'stellar-wallet',
  styleUrl: 'wallet.scss',
  shadow: true
})
export class Wallet {
  @State() account: StellarAccount
  @State() prompter: Prompter = {show: false}
  @State() loading: Loading = {}
  @State() error: any = null

  @Prop() server: Server

  async componentWillLoad() {
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
      this.error = loGet(err, 'response.data', err)
    }
  }

  async updateAccount(e?: Event) {
    try {
      this.error = null
      this.loading = {...this.loading, update: true}

      if (e)
        e.preventDefault()

      await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
      .then((account) => {
        delete account._links
        this.account = {...this.account, state: account}
      })
      .finally(() => this.loading = {...this.loading, update: false})
    }
    
    catch (err) {
      this.error = loGet(err, 'response.data', err)
    }
  }

  async createAccount(e: Event) {
    try {
      e.preventDefault()

      const pincode = await this.setPrompt('Enter a keystore pincode')

      if (!pincode)
        return

      this.error = null
      this.loading = {...this.loading, fund: true}

      const keypair = Keypair.random()

      await axios(`https://friendbot.stellar.org?addr=${keypair.publicKey()}`)
      .finally(() => this.loading = {...this.loading, fund: false})

      this.account = {
        publicKey: keypair.publicKey(),
        keystore: sjcl.encrypt(pincode, keypair.secret(), {
          adata: JSON.stringify({
            publicKey: keypair.publicKey()
          })
        })
      }

      await set('keyStore', btoa(this.account.keystore))

      this.updateAccount()
    } 
    
    catch(err) {
      this.error = loGet(err, 'response.data', err)
    }
  }

  async makePayment(e: Event) {
    try {
      e.preventDefault()

      let instructions

      instructions = await this.setPrompt('{Amount} {Destination}')
      instructions = instructions.split(' ')

      const pincode = await this.setPrompt('Enter your keystore pincode')

      if (
        !instructions
        || !pincode
      ) return

      this.error = null
      this.loading = {...this.loading, pay: true}

      const keypair = Keypair.fromSecret(
        sjcl.decrypt(pincode, this.account.keystore)
      )

      await this.server
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
      .finally(() => {
        this.loading = {...this.loading, pay: false}
        this.updateAccount()
      })
    }

    catch (err) {
      this.error = loGet(err, 'response.data', err)
    }
  }

  async copySecret(e: Event) {
    try {
      e.preventDefault()

      const pincode = await this.setPrompt('Enter your keystore pincode')

      if (!pincode)
        return

      const secret = sjcl.decrypt(pincode, this.account.keystore)
      copy(secret)
    }

    catch (err) {
      this.error = loGet(err, 'response.data', err)
    }
  }

  setPrompt(
    message: string = '',
    placeholder: string = ''
  ): Promise<string> {
    this.prompter = {
      ...this.prompter, 
      show: true,
      message,
      placeholder
    }

    return new Promise((resolve, reject) => { 
      this.prompter.resolve = resolve
      this.prompter.reject = reject
    })
  }

  render() {
    return [
      <stellar-prompt prompter={this.prompter} />,
      <form>
        {
          this.account 
          ? [
            <p>{this.account.publicKey}</p>,
            <button type="button" onClick={(e) => this.makePayment(e)}>{this.loading.pay ? <stellar-loader /> : null} Make Payment</button>,
            <button type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>,
            <button type="button" onClick={(e) => this.updateAccount(e)}>{this.loading.update ? <stellar-loader /> : null} Update Account</button>,
            this.account.state ? <pre class="account">{JSON.stringify(this.account.state, null, 2)}</pre> : null
          ] 
          : <button type="button" onClick={(e) => this.createAccount(e)}>{this.loading.fund ? <stellar-loader /> : null} Create Account</button>
        }
      </form>,
      this.error ? <pre class="error">{JSON.stringify(this.error, null, 2)}</pre> : null
    ]
  }
}
