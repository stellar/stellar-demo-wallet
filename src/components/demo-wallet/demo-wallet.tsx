import { Component, State, Host, h } from '@stencil/core'
import { Keypair } from 'stellar-sdk'

console.log(Keypair)

interface Account {
  publicKey: String
}

@Component({
  tag: 'stellar-demo-wallet',
  styleUrl: 'demo-wallet.scss',
  shadow: true
})
export class DemoWallet {
  @State() account: Account;

  createAccount(e: Event) {
    e.preventDefault()

    console.log(
      Keypair
    )
  }

  render() {
    return (
      <Host>
        <form onSubmit={(e) => this.createAccount(e)}>
          {this.account ? <input type="text"/> : <button type="submit">Create Account</button>}
        </form>
      </Host>
    );
  }
}
