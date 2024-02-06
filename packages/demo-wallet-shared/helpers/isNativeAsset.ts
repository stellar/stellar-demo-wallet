export const isNativeAsset = (assetCode: string) =>
  ["XLM", "NATIVE"].includes(assetCode.toLocaleUpperCase());
