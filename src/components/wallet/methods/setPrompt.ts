import { PromptInput } from '../../prompt/promptInput'

interface setPrompt {
  message: string
  inputs?: Array<any>
}

export default function setPrompt({
  message,
  inputs,
}: setPrompt): Promise<string> {
  if (!inputs) {
    inputs = [new PromptInput('text')]
  }
  this.prompter = {
    ...this.prompter,
    show: true,
    message,
    inputs,
  }

  return new Promise((resolve, reject) => {
    this.prompter.resolve = resolve
    this.prompter.reject = reject
  })
}
