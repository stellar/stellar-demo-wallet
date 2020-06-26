import { h } from '@stencil/core'

export interface PopupContents {
  contents: HTMLElement
  confirmLabel?: string
  cancelLabel?: string
}
const popup = async function (popup: PopupContents) {
  try {
    await new Promise((res, rej) => {
      const cancelButton = popup.cancelLabel ? (
        <button onClick={rej}>{popup.cancelLabel}</button>
      ) : null
      const confirmButton = popup.confirmLabel ? (
        <button onClick={res}>{popup.confirmLabel}</button>
      ) : null
      this.promptContents = (
        <div>
          <div>{popup.contents}</div>
          <div class="button-row">
            {cancelButton}
            {confirmButton}
          </div>
        </div>
      )
    })
  } finally {
    this.promptContents = null
  }
}

export default popup
