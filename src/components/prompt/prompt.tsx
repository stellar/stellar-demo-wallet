import { Component, Prop, Element, Watch, Host, h, State } from '@stencil/core'
import { defer as loDefer } from 'lodash-es'

export interface Prompter {
  show: boolean
  message?: string
  placeholder?: string
  resolve?: Function
  reject?: Function
}

@Component({
  tag: 'stellar-prompt',
  styleUrl: 'prompt.scss',
  shadow: true
})
export class Prompt {
  @Element() private element: HTMLElement

  @Prop({mutable: true}) prompter: Prompter

  @State() private input: string

  @Watch('prompter')
  watchHandler(newValue: Prompter, oldValue: Prompter) {
    if (newValue.show === oldValue.show)
      return

    if (newValue.show) {
      this.input = null
      loDefer(() => this.element.shadowRoot.querySelector('input').focus())
    }
    
    else {
      this.prompter.message = null
      this.prompter.placeholder = null
    }
  }

  cancel(e: Event) {
    e.preventDefault()

    this.prompter = {
      ...this.prompter, 
      show: false
    }
    this.prompter.reject(null)
  }

  submit(e: Event) {
    e.preventDefault()

    this.prompter = {
      ...this.prompter, 
      show: false
    }
    this.prompter.resolve(this.input)
  }

  update(e) {
    this.input = e.target.value
  }

  render() {
    return this.prompter.show ? (
      <Host>
        <div class="prompt-wrapper">
          <div class="prompt">
            {this.prompter.message ? <p>{this.prompter.message}</p> : null}
            
            <input type="text" 
              placeholder={this.prompter.placeholder} 
              onKeyUp={(e) => e.keyCode === 13 ? this.submit(e) : e.keyCode === 27 ? this.cancel(e) : null}
              value={this.input} 
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