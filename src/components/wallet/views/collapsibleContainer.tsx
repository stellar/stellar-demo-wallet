import { Component, State, Prop, h, Listen } from '@stencil/core'
@Component({
  tag: 'collapsible-container',
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
        <button onClick={(e) => this.handleClick()}>
          {this.open ? this.hideText : this.showText}
        </button>
        <div style={{ display: this.open ? 'block' : 'none' }}>
          <slot></slot>
        </div>
      </div>
    )
  }
}
