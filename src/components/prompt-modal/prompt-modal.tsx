import { Component, Prop, Element, Watch, Host, h } from '@stencil/core'
import { defer } from 'lodash-es'

export interface Prompt {
  show: boolean
  message?: string
  placeholder?: string
  input?: string
}

@Component({
  tag: 'stellar-prompt-modal',
  styleUrl: 'prompt-modal.scss',
  shadow: true
})
export class PromptModal {
  @Element() private element: HTMLElement;

  @Prop({mutable: true}) prompt: Prompt

  @Watch('prompt')
  watchHandler(newValue: Prompt, oldValue: Prompt) {
    if (newValue.show === oldValue.show)
      return

    if (newValue.show)
      defer(() => this.element.shadowRoot.querySelector('input').focus())
    
    else {
      this.prompt.input = null
      this.prompt.message = null
      this.prompt.placeholder = null
    }
  }

  cancel(e: Event) {
    e.preventDefault()

    this.prompt = {
      ...this.prompt, 
      show: false
    }
  }

  submit(e: Event) {
    e.preventDefault()

    this.prompt = {
      ...this.prompt, 
      show: false
    }
  }

  update(e) {
    this.prompt.input = e.target.value
  }

  render() {
    return this.prompt.show ? (
      <Host>
        <div class="prompt-wrapper">
          <div class="prompt">
            {this.prompt.message ? <p>{this.prompt.message}</p> : null}
            
            <input type="text" 
              placeholder={this.prompt.placeholder} 
              onKeyUp={(e) => e.keyCode === 13 ? this.submit(e) : e.keyCode === 27 ? this.cancel(e) : null}
              value={this.prompt.input} 
              onInput={(e) => this.update(e)}
            ></input>

            <div class="actions">
              <button class="cancel" type="button" onClick={(e) => this.cancel(e)}>Cancel</button>
              <button class="submit" type="button" onClick={(e) => this.submit(e)}>OK</button>
            </div>
          </div>
        </div>
      </Host>
    ) : null
  }
}