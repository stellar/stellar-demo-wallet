import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'

export default function render() {
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