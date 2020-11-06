import { Component, State, Prop } from '@stencil/core'
import { Server, ServerApi } from 'stellar-sdk'
import { ILogger } from '../logview/logview'

import componentWillLoad from './events/componentWillLoad' // UPDATE
import render from './events/render' // UPDATE

import createAccount from './methods/createAccount'
import updateAccount from './methods/updateAccount'
import depositAsset from './methods/depositAsset' // NEW
import withdrawAsset from './methods/withdrawAsset' // NEW
import trustAsset from './methods/trustAsset'
import makePayment from './methods/makePayment'
import makeRegulatedPayment from './methods/makeRegulatedPayment'
import copyAddress from './methods/copyAddress'
import copySecret from './methods/copySecret'
import signOut from './methods/signOut'
import setPrompt from './methods/setPrompt'
import loadAccount from './methods/loadAccount'
import popup from './methods/popup'

import { Prompter } from '@prompt/prompt'

const MockLogger = {
  request: (url, body) => {
    console.log('Request', url, body)
  },
  response: (url, body) => {
    console.log('Response', url, body)
  },
  instruction: (title, body) => {
    console.log('Instruction', title, body)
  },
  error: (url, body) => {
    console.error('Error', url, body)
  },
}

interface StellarAccount {
  publicKey: string
  secretKey: string
  state?: ServerApi.AccountRecord
  claimableBalances?: ServerApi.ClaimableBalanceRecord
}

interface Loading {
  create?: boolean
  load?: boolean
  pay?: boolean
  trust?: boolean
  update?: boolean
  deposit?: boolean // NEW
  withdraw?: boolean // NEW
}

@Component({
  tag: 'stellar-wallet',
  styleUrl: 'wallet.scss',
  shadow: true,
})
export class Wallet {
  @State() account: StellarAccount
  @State() prompter: Prompter = { show: false, inputs: [] }
  @State() loading: Loading = {}
  @State() error: any
  @State() promptContents: string = null

  @Prop() server: Server = new Server('https://horizon-testnet.stellar.org')
  @Prop() homeDomain: string = 'testanchor.stellar.org'
  @Prop() toml: any // NEW

  // Component events
  componentWillLoad() {}
  render() {}

  @Prop()
  logger: ILogger = MockLogger

  // Stellar methods
  createAccount = createAccount
  loadAccount = loadAccount
  updateAccount = updateAccount
  depositAsset = depositAsset // NEW
  withdrawAsset = withdrawAsset // NEW
  trustAsset = trustAsset
  makePayment = makePayment
  makeRegulatedPayment = makeRegulatedPayment
  copyAddress = copyAddress
  copySecret = copySecret
  signOut = signOut

  // Misc methods
  setPrompt = setPrompt
  popup = popup
}

Wallet.prototype.componentWillLoad = componentWillLoad
Wallet.prototype.render = render
