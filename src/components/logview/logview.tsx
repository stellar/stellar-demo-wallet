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
  title?: string
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

  // Log an outgoing network request with a url and optional body
  @Method()
  async request(url: string, body?: string) {
    console.log('Request', url, body)
    this.append({ type: LogDataType.Request, url, body })
  }

  // Log the incoming response from a request
  @Method()
  async response(url: string, body?: string) {
    console.log('Response', url, body)
    this.append({ type: LogDataType.Response, url, body })
  }

  // Log an informational statement with a title and optional body
  @Method()
  async instruction(title: string, body?: string) {
    console.log('Instruction', title, body)
    this.append({ type: LogDataType.Instruction, title, body })
  }

  // Log an error with a title and optional body
  @Method()
  async error(title: string, body?: string) {
    console.error(title, body)
    this.append({ type: LogDataType.Error, title, body })
  }

  clear() {
    this.logs = []
  }

  transformToElement(data: LogData) {
    switch (data.type) {
      case LogDataType.Instruction:
        return (
          <div class="instruction entry">
            <div class="title">{data.title}</div>
            {data.body ? <div class="body">{data.body}</div> : null}
          </div>
        )

      case LogDataType.Error:
        return (
          <div class="error entry">
            <div class="title">{data.title}</div>
            {data.body ? <div class="body">{data.body}</div> : null}
          </div>
        )

      case LogDataType.Request:
        const requestBody =
          typeof data.body == 'string'
            ? data.body
            : JSON.stringify(data.body, null, 2)
        return (
          <div class="request entry">
            <div class="title">{data.url}</div>
            <div class="body">{requestBody}</div>
          </div>
        )

      case LogDataType.Response:
        const responseBody =
          typeof data.body == 'string'
            ? data.body
            : JSON.stringify(data.body, null, 2)
        return (
          <div class="response entry">
            <div class="title">{data.url}</div>
            <div class="body">{responseBody}</div>
          </div>
        )

      default:
        return null
    }
  }

  render() {
    return (
      <div class="logview">
        <button class="clear-button" onClick={(_) => this.clear()}>
          Clear
        </button>
        {this.logs.map((l) => this.transformToElement(l))}
      </div>
    )
  }
}
