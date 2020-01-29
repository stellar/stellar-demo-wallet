import {
  Component,
  State,
  h,
  Prop
} from '@stencil/core'
import copy from 'copy-to-clipboard'
import sjcl from 'sjcl'
import axios from 'axios'
import {
  get,
  set
} from '../../services/storage'
import { handleError } from '../../services/error'
import { Prompter } from '../prompt/prompt'
import {
  Keypair,
  Server,
  ServerApi,
  Account,
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Operation,
  Asset
} from 'stellar-sdk'
import {
  has as loHas,
  omit as loOmit,
  // each as loEach,
  map as loMap
} from 'lodash-es'

interface StellarAccount {
  publicKey: string,
  keystore: string,
  state?: ServerApi.AccountRecord
}

interface Loading {
  fund?: boolean,
  pay?: boolean,
  update?: boolean,
  trust?: boolean
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
      this.error = handleError(err)
    }
  }

  async updateAccount(e?: Event) {
    try {
      if (e)
        e.preventDefault()

      this.error = null
      this.loading = {...this.loading, update: true}

      await this.server
      .accounts()
      .accountId(this.account.publicKey)
      .call()
      .then((account) => {
        account.balances = loMap(account.balances, (balance) => loOmit(balance, [
          'limit',
          'buying_liabilities',
          'selling_liabilities',
          'is_authorized',
          'last_modified_ledger',
          balance.asset_type !== 'native' ? 'asset_type' : null
        ]))

        this.account = {...this.account, state: loOmit(account, [
          'id',
          '_links',
          'sequence',
          'subentry_count',
          'last_modified_ledger',
          'flags',
          'thresholds',
          'account_id',
          'signers',
          'paging_token',
          'data_attr'
        ])}
      })
      .finally(() => this.loading = {...this.loading, update: false})
    }

    catch (err) {
      this.error = handleError(err)
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
      this.error = handleError(err)
    }
  }

  async trustAsset(
    e?: Event,
    asset?: string,
    issuer?: string
  ) {
    try {
      e.preventDefault()

      let instructions

      if (
        asset
        && issuer
      ) instructions = [asset, issuer]

      else {
        instructions = await this.setPrompt('{Asset} {Issuer}')
        instructions = instructions.split(' ')
      }

      const pincode = await this.setPrompt('Enter your keystore pincode')

      if (
        !instructions
        || !pincode
      ) return

      const keypair = Keypair.fromSecret(
        sjcl.decrypt(pincode, this.account.keystore)
      )

      this.error = null
      this.loading = {...this.loading, trust: true}

      return this.server.accounts()
      .accountId(keypair.publicKey())
      .call()
      .then(({sequence}) => {
        const account = new Account(keypair.publicKey(), sequence)
        const transaction = new TransactionBuilder(account, {
          fee: BASE_FEE,
          networkPassphrase: Networks.TESTNET
        })
        .addOperation(Operation.changeTrust({
          asset: new Asset(instructions[0], instructions[1])
        }))
        .setTimeout(0)
        .build()

        transaction.sign(keypair)
        return this.server.submitTransaction(transaction)
      })
      .then((res) => console.log(res))
      .finally(() => {
        this.loading = {...this.loading, trust: false}
        this.updateAccount()
      })
    }

    catch (err) {
      this.error = handleError(err)
    }
  }

  async makePayment(
    e?: Event,
    destination?: string,
    asset?: string,
    issuer?: string
  ) {
    try {
      e.preventDefault()

      let instructions

      if (
        destination
        && asset
      ) {
        instructions = await this.setPrompt(`How much ${asset} to pay?`)
        instructions = [instructions, asset, destination, issuer]
      }

      else {
        instructions = await this.setPrompt('{Amount} {Asset} {Destination}')
        instructions = instructions.split(' ')

        if (!/xlm/gi.test(instructions[1]))
          instructions[3] = await this.setPrompt(`Who issues the ${instructions[1]} asset?`, 'Enter ME to refer to yourself')
      }

      const pincode = await this.setPrompt('Enter your keystore pincode')

      if (
        !instructions
        || !pincode
      ) return

      const keypair = Keypair.fromSecret(
        sjcl.decrypt(pincode, this.account.keystore)
      )

      if (/me/gi.test(instructions[3]))
        instructions[3] = keypair.publicKey()

      this.error = null
      this.loading = {...this.loading, pay: true}

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
          destination: instructions[2],
          asset: instructions[3] ? new Asset(instructions[1], instructions[3]) : Asset.native(),
          amount: instructions[0]
        }))
        .setTimeout(0)
        .build()

        transaction.sign(keypair)
        return this.server.submitTransaction(transaction)
        .catch((err) => {
          if ( // Paying an account which doesn't exist, create it instead
            loHas(err, 'response.data.extras.result_codes.operations')
            && err.response.data.status === 400
            && err.response.data.extras.result_codes.operations.indexOf('op_no_destination') !== -1
            && !instructions[3]
          ) {
            const transaction = new TransactionBuilder(account, {
              fee: BASE_FEE,
              networkPassphrase: Networks.TESTNET
            })
            .addOperation(Operation.createAccount({
              destination: instructions[2],
              startingBalance: instructions[0]
            }))
            .setTimeout(0)
            .build()

            transaction.sign(keypair)
            return this.server.submitTransaction(transaction)
          }

          else throw err
        })
      })
      .then((res) => console.log(res))
      .finally(() => {
        this.loading = {...this.loading, pay: false}
        this.updateAccount()
      })
    }

    catch (err) {
      this.error = handleError(err)
    }
  }

  async copySecret(e: Event) {
    try {
      e.preventDefault()

      const pincode = await this.setPrompt('Enter your keystore pincode')

      if (!pincode)
        return

      this.error = null

      const secret = sjcl.decrypt(pincode, this.account.keystore)
      copy(secret)
    }

    catch (err) {
      this.error = handleError(err)
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
            <button class={this.loading.pay ? 'loading' : null} type="button" onClick={(e) => this.makePayment(e)}>{this.loading.pay ? <stellar-loader /> : null} Make Payment</button>,
            <button class={this.loading.trust ? 'loading' : null} type="button" onClick={(e) => this.trustAsset(e)}>{this.loading.trust ? <stellar-loader /> : null} Trust Asset</button>,
            <button class={this.loading.update ? 'loading' : null} type="button" onClick={(e) => this.updateAccount(e)}>{this.loading.update ? <stellar-loader /> : null} Update Account</button>,
            <button type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>,
          ]
          : <button class={this.loading.fund ? 'loading' : null} type="button" onClick={(e) => this.createAccount(e)}>{this.loading.fund ? <stellar-loader /> : null} Create Account</button>
        }
      </form>,
      this.error ? <pre class="error">{JSON.stringify(this.error, null, 2)}</pre> : null,
      loHas(this.account, 'state') ? <pre class="account">{JSON.stringify(this.account.state, null, 2)}</pre> : null,
    ]
  }
}