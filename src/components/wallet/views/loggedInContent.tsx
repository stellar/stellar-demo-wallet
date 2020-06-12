import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'

import balanceDisplay from './balanceDisplay'

export default function () {
  return [
    <div class="account-key">
      <p>{this.account.publicKey}</p>
      <button class="small" type="button" onClick={() => this.copyAddress()}>
        Copy Address
      </button>
      <button class="small" type="button" onClick={() => this.copySecret()}>
        Copy Secret
      </button>
    </div>,

    <button
      class={this.loading.deposit ? 'loading' : null}
      type="button"
      onClick={() => this.depositAsset()}
    >
      {this.loading.deposit ? <stellar-loader /> : null} Deposit Asset
    </button>,
    <button
      class={this.loading.withdraw ? 'loading' : null}
      type="button"
      onClick={() => this.withdrawAsset()}
    >
      {this.loading.withdraw ? <stellar-loader /> : null} Withdraw Asset
    </button>,

    <button
      class={this.loading.trust ? 'loading' : null}
      type="button"
      onClick={() => this.trustAsset()}
    >
      {this.loading.trust ? <stellar-loader /> : null} Trust Asset
    </button>,
    <button
      class={this.loading.pay ? 'loading' : null}
      type="button"
      onClick={() => this.makePayment()}
    >
      {this.loading.pay ? <stellar-loader /> : null} Make Payment
    </button>,

    balanceDisplay.call(this),

    loHas(this.account, 'state') ? (
      <pre class="account-state">
        {JSON.stringify(this.account.state, null, 2)}
      </pre>
    ) : null,

    this.account
      ? [
          <button
            class={this.loading.update ? 'loading' : null}
            type="button"
            onClick={() => this.updateAccount()}
          >
            {this.loading.update ? <stellar-loader /> : null} Update Account
          </button>,
          <button type="button" onClick={() => this.signOut()}>
            Sign Out
          </button>,
        ]
      : null,
  ]
}
