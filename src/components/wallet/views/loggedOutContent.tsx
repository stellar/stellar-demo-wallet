import { h } from '@stencil/core'
import { Wallet } from '../wallet'
import { Networks } from 'stellar-sdk'

export default function loggedOutContent(this: Wallet) {
  let content = []
  // Don't display Create Account button when on mainnet
  // This is because there is no friendbot on mainnet
  if (this.network_passphrase === Networks.TESTNET) {
    content.push(
      <button
        class={this.loading.create ? 'loading' : null}
        type="button"
        onClick={() => this.createAccount()}
      >
        {this.loading.create ? <stellar-loader /> : null} Create Account
      </button>
    )
  }
  content.push(
    <button
      class={this.loading.load ? 'loading' : null}
      type="button"
      onClick={(_) => this.loadAccount({ displayPrompt: true })}
    >
      {this.loading.load ? <stellar-loader /> : null} Load Account
    </button>
  )
  content.push(
    <button
      class={null}
      type="button"
      onClick={(_) => this.switchNetworks({ loggedIn: false })}
    >
      {this.network_passphrase === Networks.TESTNET
        ? 'Use Pubnet'
        : 'Use Testnet'}
    </button>
  )
  return content
}
