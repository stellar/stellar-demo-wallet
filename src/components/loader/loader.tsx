import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'stellar-loader',
  styleUrl: 'loader.css',
  shadow: true
})
export class Loader {

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
