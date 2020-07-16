import { h } from '@stencil/core'

export default function WalletButton(title, loadingKey, callback) {
  const loader = this.loading[loadingKey] ? <stellar-loader /> : null
  return (
    <button onClick={() => callback()}>
      {title}
      {loader}
    </button>
  )
}
