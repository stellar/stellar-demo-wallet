import { Component, h, State, Method } from '@stencil/core'

enum LogDataType {
  Instruction = 1,
  Request,
  Response,
  Error,
}
interface LogData {
  type: LogDataType
  title?: string
  body?: string | object
}

export interface ILogger {
  request: (url: string, body?: string | object) => Promise<void> | void
  response: (url: string, body?: string | object) => Promise<void> | void
  instruction: (title: string, body?: string) => Promise<void> | void
  error: (title: string, body?: string | object) => Promise<void> | void
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
  async request(url: string, body?: string | object) {
    console.log('Request', url, body)
    this.append({ type: LogDataType.Request, title: url, body })
  }

  // Log the incoming response from a request
  @Method()
  async response(url: string, body?: string | object) {
    console.log('Response', url, body)
    this.append({ type: LogDataType.Response, title: url, body })
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
    const className = {
      [LogDataType.Instruction]: 'instruction',
      [LogDataType.Error]: 'error',
      [LogDataType.Request]: 'request',
      [LogDataType.Response]: 'response',
    }[data.type]
    const body =
      typeof data.body === 'object' ? (
        <json-viewer data={data.body}></json-viewer>
      ) : (
        data.body
      )
    return (
      <div class={`entry ${className}`}>
        <div class="title">{data.title}</div>
        {body ? <div class="body">{body}</div> : null}
      </div>
    )
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
