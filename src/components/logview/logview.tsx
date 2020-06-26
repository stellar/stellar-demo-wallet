import { Component, h, State, Method } from '@stencil/core'

enum LogDataType {
  Instruction = 1,
  Request,
  Response,
  Error,
}
interface LogData {
  type: LogDataType
  url?: string
  body?: string
}

@Component({
  tag: 'log-view',
  styleUrl: 'logview.scss',
  shadow: true,
})
export class LogView {
  @State() logs: LogData[] = []

  append(data: LogData) {
    this.logs = [...this.logs, data]
  }

  @Method()
  async request(url, body) {
    console.log('Request', url, body)
    this.append({ type: LogDataType.Request, url, body })
  }

  @Method()
  async response(url, body) {
    console.log('Response', url, body)
    this.append({ type: LogDataType.Response, url, body })
  }

  @Method()
  async instruction(text: string) {
    this.append({ type: LogDataType.Instruction, body: text })
  }

  @Method()
  async error(text: string) {
    this.append({ type: LogDataType.Error, body: text })
  }

  transformToElement(data: LogData) {
    switch (data.type) {
      case LogDataType.Instruction:
        return <div class="instruction entry">{data.body}</div>
      case LogDataType.Error:
        return <div class="error entry">{data.body}</div>
      case LogDataType.Request:
        return (
          <div class="request entry">
            <div class="title">{data.url}</div>
            <div class="body">{JSON.stringify(data.body, null, 2)}</div>
          </div>
        )

      case LogDataType.Response:
        return (
          <div class="response entry">
            <div class="title">{data.url}</div>
            <div class="body">{JSON.stringify(data.body, null, 2)}</div>
          </div>
        )
      default:
        return null
    }
  }

  render() {
    return (
      <div class="logview">
        <h1>Log View</h1>
        {this.logs.map((l) => this.transformToElement(l))}
      </div>
    )
  }
}
