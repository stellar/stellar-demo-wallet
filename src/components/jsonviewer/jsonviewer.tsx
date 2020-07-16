import { Component, h, Prop } from '@stencil/core'

@Component({
  tag: 'json-viewer',
  styleUrl: 'jsonviewer.scss',
  shadow: true,
})
export class JSONViewer {
  @Prop() data: any

  render() {
    return (
      <div>
        {'{'}
        <div class="indent">
          {Object.keys(this.data).map((key) => {
            const val = this.data[key]
            let display = ''
            switch (typeof val) {
              case 'object':
                display = (
                  <details>
                    <summary>
                      {key}: {Object.keys(val).length} values
                    </summary>
                    <json-viewer data={val}></json-viewer>
                  </details>
                )
                break
              case 'function':
                display = `${key}: Function`
                break
              default:
                display = `${key}: ${val}`
            }
            return <div>{display}</div>
          })}
        </div>
        {'}'}
      </div>
    )
  }
}
