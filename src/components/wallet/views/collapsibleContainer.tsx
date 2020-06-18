import { Component, State, Prop, h, Listen } from '@stencil/core'
@Component({
  tag: 'collapsible-container',
})
export class CollapsibleContainer {
  @State() open: boolean
  @Listen('click', { capture: true })
  handleClick() {
    this.open = !this.open
  }

  render() {
    return (
      <div>
        <button>{this.open ? 'Hide Details' : 'Show Details'}</button>
        <div style={{ display: this.open ? 'block' : 'none' }}>
          <slot></slot>
        </div>
      </div>
    )
  }
}
