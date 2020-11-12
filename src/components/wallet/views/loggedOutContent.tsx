import { h } from '@stencil/core'
import { Wallet } from '../wallet'

export default function loggedOutContent(this: Wallet) {
  return [
    <button
      class={this.loading.create ? 'loading' : null}
      type="button"
      onClick={() => this.createAccount()}
    >
      {this.loading.create ? <stellar-loader /> : null} Create Account
    </button>,
    <button
      class={this.loading.load ? 'loading' : null}
      type="button"
      onClick={(_) => this.loadAccount({ displayPrompt: true })}
    >
      {this.loading.load ? <stellar-loader /> : null} Load Account
    </button>,
  ]
}
