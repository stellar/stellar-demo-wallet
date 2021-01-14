import { h } from '@stencil/core'
import { has as loHas } from 'lodash-es'

import balanceDisplay from './balanceDisplay'
import claimableDisplay from './claimableDisplay'
import { Wallet } from '../wallet'
import { Networks } from 'stellar-sdk'

export default function loggedInContent(this: Wallet) {
  return [
    <div class="account-key">
      <p>
        {this.account.publicKey.substring(0, 6)}...
        {this.account.publicKey.substring(this.account.publicKey.length - 6)}
      </p>
      <button class="small" type="button" onClick={() => this.copyAddress()}>
        Copy Address
      </button>
      <button class="small" type="button" onClick={() => this.copySecret()}>
        Copy Secret
      </button>
      <button
        class="small"
        type="button"
        onClick={(_) => this.switchNetworks({ loggedIn: true })}
      >
        {this.network_passphrase === Networks.TESTNET
          ? 'Use Pubnet'
          : 'Use Testnet'}
      </button>
    </div>,

    balanceDisplay.call(this),
    claimableDisplay.call(this),

    <button
      class={this.loading.trust ? 'loading' : null}
      type="button"
      onClick={() => this.addAsset()}
    >
      + Add Asset {this.loading.trust ? <stellar-loader /> : null}
    </button>,

    this.account
      ? [
          <button
            class={this.loading.update ? 'loading' : null}
            type="button"
            onClick={() => this.updateAccount()}
          >
            Refresh Account {this.loading.update ? <stellar-loader /> : null}
          </button>,
          <button type="button" onClick={() => this.signOut()}>
            Sign Out
          </button>,
        ]
      : null,

    loHas(this.account, 'state') ? (
      <collapsible-container
        id="account-details-container"
        hideText="Hide Account Details"
        showText="Show Account Details"
      >
        <pre class="account-state" style={{ overflow: 'scroll' }}>
          {JSON.stringify(this.account.state, null, 2)}
        </pre>
      </collapsible-container>
    ) : null,
  ]
}
