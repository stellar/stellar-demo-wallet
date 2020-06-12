import { h } from '@stencil/core'

export default function () {
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
      onClick={(e) => this.loadAccount(e)}
    >
      {this.loading.load ? <stellar-loader /> : null} Load Account
    </button>,
  ]
}
