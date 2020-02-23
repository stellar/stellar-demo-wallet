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
  type?: string
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
    addEventListener('keyup', (e: KeyboardEvent) => {
      if (this.prompter.show)
        e.keyCode === 13
        ? this.submit()
        : e.keyCode === 27
        ? this.cancel()
        : null
    })
  }

  cancel() {
    this.prompter = {
      ...this.prompter,
      show: false
    }
    this.prompter.reject(null)
  }

  submit() {
    this.prompter = {
      ...this.prompter,
      show: false
    }
    this.prompter.resolve(this.input)
  }

  update(e: any) {
    this.input = e.target.value.toUpperCase()
  }

  render() {
    return (
      <div class="prompt-wrapper" style={this.prompter.show ? null : {display: 'none'}}>
        <div class="prompt">
          {this.prompter.message ? <p>{this.prompter.message}</p> : null}

          {
            this.prompter.options
            ? <div class="select-wrapper">
                <select onInput={(e) => this.update(e)}>
                  {this.prompter.options.map((option) =>
                    <option
                      value={`${option.code}:${option.issuer}`}
                      selected={this.input === `${option.code}:${option.issuer}`}
                    >{option.code}</option>
                  )}
                </select>
              </div>
            : <input
                type={this.prompter.type}
                placeholder={this.prompter.placeholder}
                value={this.input}
                onInput={(e) => this.update(e)}
                style={this.prompter.type === 'password' ? {'font-size': '18px'} : null}
              ></input>
          }

          <div class="actions">
            <button class="cancel" type="button" onClick={() => this.cancel()}>Cancel</button>
            <button class="submit" type="button" onClick={() => this.submit()}>OK</button>
          </div>
        </div>
      </div>
    )
  }
}