import { Plugins } from "@capacitor/core";

const { Storage } = Plugins;

export async function set(key: string, value: any): Promise<void> {
  await Storage.set({
    key,
    value,
  });
}

export async function get(key: string): Promise<any> {
  const item = await Storage.get({ key });
  return item.value;
}

export async function remove(key: string): Promise<void> {
  await Storage.remove({ key });
}
