import Combinatorics from 'js-combinatorics'
import {
  Component,
  h,
  State,
  Prop
} from '@stencil/core';
import {
  isEqual as loIsEqual,
  sample as loSample
} from 'lodash-es'

@Component({
  tag: 'stellar-loader',
  styleUrl: 'loader.scss',
  shadow: true
})
export class Loader {
  @State() chances: any = []
  @State() chance: any = null
  @Prop() interval: any

  componentWillLoad() {
    return new Promise((resolve) => {
      if (!this.chances.length)
        this.generateChances(9)

      if (!this.interval)
        this.interval = setInterval(() => this.getChance(), 100)

      resolve()
    })
  }

  generateChances(int: number) {
    const baseN = Combinatorics.baseN([0, 1], int)

    this.chances = baseN.toArray()
    this.getChance()
  }
  getChance() {
    const chance = loSample(this.chances)

    if (loIsEqual(chance, this.chance))
      this.getChance()
    else
      this.chance = chance
  }

  render() {
    return (
      <div class="loader">
        {this.chance.map((int, i) =>
          <div class={int ? 'on' : null} key={`${int}${i}`}></div>
        )}
      </div>
    )
  }
}
