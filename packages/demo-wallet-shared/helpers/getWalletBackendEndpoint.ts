export const getWalletBackendEndpoint = () => {
  return window._env_.WALLET_BACKEND_ENDPOINT ?? "";
}