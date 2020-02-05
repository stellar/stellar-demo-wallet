import {
  Component,
  State,
  Prop
} from '@stencil/core'
import {
  Server,
  ServerApi,
} from 'stellar-sdk'

import componenetWillLoad from './events/componentWillLoad'
import render from './events/render'

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import makePayment from './methods/makePayment'
import trustAsset from './methods/trustAsset'
import depositAsset from './methods/depositAsset'
import withdrawAsset from './methods/withdrawAsset'
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import setPrompt from './methods/setPrompt'
import signOut from './methods/signOut'

import { Prompter } from '@prompt/prompt'

interface StellarAccount {
  state?: ServerApi.AccountRecord,
  publicKey: string,
  keystore: string,
}

interface Loading {
  fund?: boolean,
  pay?: boolean,
  trust?: boolean,
  update?: boolean,
  deposit?: boolean,
  withdraw?: boolean
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
  @Prop() homeDomain: String
  @Prop() toml: Object

  // Component events
  componentWillLoad = componenetWillLoad
  render = render

  // Stellar methods
  createAccount = createAccount
  updateAccount = updateAccount
  makePayment = makePayment
  depositAsset = depositAsset
  withdrawAsset = withdrawAsset
  trustAsset = trustAsset
  signOut = signOut

  // Misc methods
  copyAddress = copyAddress
  copySecret = copySecret
  setPrompt = setPrompt
}