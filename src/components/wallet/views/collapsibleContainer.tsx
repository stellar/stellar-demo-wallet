import { Component, State, Prop, h } from '@stencil/core'
@Component({
  tag: 'collapsible-container',
  shadow: true,
})
export class CollapsibleContainer {
  @Prop() hideText: string = 'Hide'
  @Prop() showText: string = 'Show'
  @State() open: boolean

  handleClick() {
    this.open = !this.open
  }

  render() {
    return (
      <div>
        <button onClick={() => this.handleClick()}>
          {this.open ? this.hideText : this.showText}
        </button>
        <div style={{ display: this.open ? 'block' : 'none' }}>
          <slot></slot>
        </div>
      </div>
    )
  }
}
