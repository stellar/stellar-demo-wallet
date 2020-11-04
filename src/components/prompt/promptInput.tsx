// PromptInput may be a '<select></select>` tag
// So this class is for the '<option></option>' tags
export class PromptSelectInputOption {
  value: any
  showValue: string
  selected: boolean
}

export class PromptInput {
  constructor(
    public placeholder?: string,
    public type: string = 'text',
    public value?: string,
    public options?: Array<PromptSelectInputOption>
  ) {}

  update(e: any) {
    this.value = e.target.value
  }
}
