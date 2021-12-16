export const shortenStellarKey = (key: string) =>
  key ? `${key.slice(0, 5)}…${key.slice(-5)}` : "";
