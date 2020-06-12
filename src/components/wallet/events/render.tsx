import { h } from '@stencil/core'

import loggedInContent from '../views/loggedInContent'
import loggedOutContent from '../views/loggedOutContent'

export default function () {
  return [
    <stellar-prompt prompter={this.prompter} />,

    this.account ? loggedInContent.call(this) : loggedOutContent.call(this),

    this.error ? (
      <pre class="error">{JSON.stringify(this.error, null, 2)}</pre>
    ) : null,
  ]
}
