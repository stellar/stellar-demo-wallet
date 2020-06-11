import { Plugins } from '@capacitor/core'

const { Storage } = Plugins

export function set(key: string, value: any): Promise<void> {
  return Storage.set({
    key,
    value,
  })
}

export async function get(key: string): Promise<any> {
  const item = await Storage.get({ key })
  return item.value
}

export function remove(key: string): Promise<void> {
  return Storage.remove({ key })
}
