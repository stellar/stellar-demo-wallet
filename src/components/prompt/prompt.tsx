import {
  Component,
  Prop,
  Element,
  Watch,
  h,
  State
} from '@stencil/core'
import { defer as loDefer } from 'lodash-es'

export interface Prompter {
  show: boolean
  message?: string
  placeholder?: string
  options?: Array<any>
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

      if (newValue.options)
        this.input = this.input || `${newValue.options[0].code}:${newValue.options[0].issuer}`
      else
        loDefer(() => this.element.shadowRoot.querySelector('input').focus())
    }

    else {
      this.prompter.message = null
      this.prompter.placeholder = null
      this.prompter.options = null
    }
  }

  componentDidLoad() {
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      if (this.prompter.show)
        e.keyCode === 13
        ? this.submit(e)
        : e.keyCode === 27
        ? this.cancel(e)
        : null
    })
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
    this.input = e.target.value.toUpperCase()
  }

  render() {
    return this.prompter.show ? (
      <div class="prompt-wrapper">
        <div class="prompt">
          {this.prompter.message ? <p>{this.prompter.message}</p> : null}

          {
            this.prompter.options
            ? <div class="select-wrapper">
                <select
                  onInput={(e) => this.update(e)}
                > {this.prompter.options.map((option) =>
                    <option
                      value={`${option.code}:${option.issuer}`}
                      selected={this.input === `${option.code}:${option.issuer}`}
                    >{option.code}</option>
                  )}
                </select>
              </div>
            : <input type="text"
                placeholder={this.prompter.placeholder}
                value={this.input}
                onInput={(e) => this.update(e)}
              ></input>
          }

          <div class="actions">
            <button class="cancel" type="button" onClick={(e) => this.cancel(e)}>Cancel</button>
            <button class="submit" type="button" onClick={(e) => this.submit(e)}>OK</button>
          </div>
        </div>
      </div>
    ) : null
  }
}