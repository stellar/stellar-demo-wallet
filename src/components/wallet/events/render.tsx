import { h } from '@stencil/core'

export default function render() {
  return [
    <stellar-prompt prompter={this.prompter} />,
    this.account
    ? [
      <div class="account-key">
        <p>{this.account.publicKey}</p>
        <button class="small" type="button" onClick={(e) => this.copyAddress(e)}>Copy Address</button>
        <button class="small" type="button" onClick={(e) => this.copySecret(e)}>Copy Secret</button>
      </div>,
    ]
    : <button type="button" onClick={(e) => this.createAccount(e)}>Create Account</button>,

    this.error ? <pre class="error">{JSON.stringify(this.error, null, 2)}</pre> : null,
    this.account ? <button type="button" onClick={(e) => this.signOut(e)}>Sign Out</button> : null,
  ]
}