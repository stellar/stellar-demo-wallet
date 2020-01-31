export default function setPrompt(
  message: string = '',
  placeholder: string = '',
  options?: Array<any>
): Promise<string> {
  this.prompter = {
    ...this.prompter,
    show: true,
    message,
    placeholder,
    options
  }

  return new Promise((resolve, reject) => {
    this.prompter.resolve = resolve
    this.prompter.reject = reject
  })
}