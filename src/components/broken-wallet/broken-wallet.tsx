import { Component, Host, h } from '@stencil/core';
import * as StellarWallet from '@stellar/wallet-sdk'

console.log(StellarWallet)

@Component({
  tag: 'stellar-broken-wallet'
})
export class BrokenWallet {
  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }
}
