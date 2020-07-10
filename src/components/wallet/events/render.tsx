import { h } from '@stencil/core'

import loggedInContent from '../views/loggedInContent'
import loggedOutContent from '../views/loggedOutContent'
import { Wallet } from '../wallet'

export default function (this: Wallet) {
  const popup = this.promptContents ? (
    <div class="popup-scrim">
      <div class="popup">{this.promptContents}</div>
    </div>
  ) : null
  return [
    <stellar-prompt prompter={this.prompter} />,
    popup,
    this.account ? loggedInContent.call(this) : loggedOutContent.call(this),
    <collapsible-container show-text="Show Logs" hide-text="Hide Logs">
      <log-view ref={(el) => (this.logger = el)}></log-view>
    </collapsible-container>,
    this.error ? (
      <pre class="error">{JSON.stringify(this.error, null, 2)}</pre>
    ) : null,
  ]
}
