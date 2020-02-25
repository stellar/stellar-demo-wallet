import {
  Component,
  State,
  Prop
} from '@stencil/core'
import {
  Server,
  ServerApi,
} from 'stellar-sdk'

import componentWillLoad from './events/componentWillLoad' // UPDATE
import render from './events/render' // UPDATE

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import depositAsset from './methods/depositAsset' // NEW
import withdrawAsset from './methods/withdrawAsset' // NEW
import trustAsset from './methods/trustAsset'
import makePayment from './methods/makePayment'
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import signOut from './methods/signOut'
import setPrompt from './methods/setPrompt'

import { Prompter } from '@prompt/prompt'

interface StellarAccount {
  publicKey: string,
  cipher: string,
  nonce: string,
  state?: ServerApi.AccountRecord,
}

interface Loading {
  fund?: boolean,
  pay?: boolean,
  trust?: boolean,
  update?: boolean,
  deposit?: boolean, // NEW
  withdraw?: boolean // NEW
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
  @State() error: any

  @Prop() server: Server = new Server('https://horizon-testnet.stellar.org')
  @Prop() homeDomain: String = 'testanchor.stellar.org'
  @Prop() toml: Object // NEW

  // Component events
  componentWillLoad() {}
  render() {}

  // Stellar methods
  createAccount = createAccount
  updateAccount = updateAccount
  depositAsset = depositAsset // NEW
  withdrawAsset = withdrawAsset // NEW
  trustAsset = trustAsset
  makePayment = makePayment
  copyAddress = copyAddress
  copySecret = copySecret
  signOut = signOut

  // Misc methods
  setPrompt = setPrompt
}

Wallet.prototype.componentWillLoad = componentWillLoad
Wallet.prototype.render = render