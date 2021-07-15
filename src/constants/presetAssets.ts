export interface presetAsset {
  assetCode: string;
  anchorHomeDomain?: string;
  issuerPublicKey?: string;
}

export const PRESET_ASSETS: presetAsset[] = [
  {
    assetCode: "MYASSET",
    anchorHomeDomain: "sep8-server.dev.stellar.org",
  },
  {
    assetCode: "SRT",
    anchorHomeDomain: "testanchor.stellar.org",
  },
];
