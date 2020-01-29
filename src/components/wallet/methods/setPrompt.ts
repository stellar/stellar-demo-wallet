export default function setPrompt(
  message: string = '',
  placeholder: string = ''
): Promise<string> {
  this.prompter = {
    ...this.prompter,
    show: true,
    message,
    placeholder
  }

  return new Promise((resolve, reject) => {
    this.prompter.resolve = resolve
    this.prompter.reject = reject
  })
}