import { Component, Prop, h } from '@stencil/core'
import { PromptInput } from './promptInput'

export interface Prompter {
  show: boolean
  message?: string
  inputs?: Array<PromptInput>
  resolve?: Function
  reject?: Function
}

@Component({
  tag: 'stellar-prompt',
  styleUrl: 'prompt.scss',
  shadow: true,
})
export class Prompt {
  // Unused currently, but it may be helpful for someone in the future
  // @Element() private element: HTMLElement

  @Prop({ mutable: true }) prompter: Prompter

  cancel() {
    this.prompter = {
      ...this.prompter,
      show: false,
    }
    this.prompter.reject(null)
  }

  submit() {
    this.prompter = {
      ...this.prompter,
      show: false,
    }
    this.prompter.resolve(this.prompter.inputs)
  }

  render() {
    return (
      <div
        class="prompt-wrapper"
        style={this.prompter.show ? null : { display: 'none' }}
      >
        <div class="prompt">
          {this.prompter.message ? <p>{this.prompter.message}</p> : null}

          <div class="inputs-wrapper">
            {this.prompter.inputs.map((i) =>
              i.type !== 'select' ? (
                <input
                  type={i.type}
                  placeholder={i.placeholder}
                  value={i.value}
                  onInput={(e) => i.update(e)}
                ></input>
              ) : (
                <select
                  onInput={(e) => {
                    i.update(e)
                  }}
                >
                  {i.options.map((option) => {
                    ;<option
                      value={option.value}
                      selected={i.value === option.value}
                    >
                      {option.showValue}
                    </option>
                  })}
                </select>
              )
            )}
          </div>

          <div class="actions">
            <button class="cancel" type="button" onClick={() => this.cancel()}>
              Cancel
            </button>
            <button class="submit" type="button" onClick={() => this.submit()}>
              OK
            </button>
          </div>
        </div>
      </div>
    )
  }
}
