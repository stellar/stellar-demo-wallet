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

import createAccount from './methods/createAccount' // UPDATE
import updateAccount from './methods/updateAccount' // NEW
import makePayment from './methods/makePayment' // NEW
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import signOut from './methods/signOut'
import setPrompt from './methods/setPrompt'

import { Prompter } from '@prompt/prompt'

interface StellarAccount { // UPDATE
  publicKey: string,
  keystore: string,
  state?: ServerApi.AccountRecord,
}

interface Loading { // NEW
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
  @State() loading: Loading = {} // NEW
  @State() error: any = null

  @Prop() server: Server // NEW

  // Component events
  componentWillLoad() {}
  render() {}

  // Stellar methods
  createAccount = createAccount // UPDATE
  updateAccount = updateAccount // NEW
  makePayment = makePayment // NEW
  copyAddress = copyAddress
  copySecret = copySecret
  signOut = signOut

  // Misc methods
  setPrompt = setPrompt
}

Wallet.prototype.componentWillLoad = componentWillLoad
Wallet.prototype.render = render