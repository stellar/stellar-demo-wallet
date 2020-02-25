interface setPrompt {
  message: string
  placeholder: string
  type: string
  options: Array<any>
}

export default function setPrompt({
  message,
  placeholder,
  type = 'text',
  options
}: setPrompt): Promise<string> {
  this.prompter = {
    ...this.prompter,
    show: true,
    message,
    placeholder,
    type,
    options
  }

  return new Promise((resolve, reject) => {
    this.prompter.resolve = resolve
    this.prompter.reject = reject
  })
}