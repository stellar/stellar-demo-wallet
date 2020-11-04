import { PromptInput } from '../../prompt/promptInput'

interface setPrompt {
  message: string
  inputs?: Array<any>
}

export default function setPrompt({
  message,
  inputs,
}: setPrompt): Promise<Array<PromptInput>> {
  if (!inputs) {
    inputs = [new PromptInput()]
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
