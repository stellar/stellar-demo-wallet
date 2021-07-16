export interface presetAsset {
  assetCode: string;
  homeDomain?: string;
  issuerPublicKey?: string;
}

export const PRESET_ASSETS: presetAsset[] = [
  {
    assetCode: "MYASSET",
    homeDomain: "sep8-server.dev.stellar.org",
  },
  {
    assetCode: "SRT",
    homeDomain: "testanchor.stellar.org",
  },
  {
    assetCode: "USDC",
    issuerPublicKey: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
];
