import { SearchParams } from "types/types.d";

export const getCurrentSessionParams = () => {
  // TODO: add claimable balance once merged
  const sessionParams = [
    SearchParams.ASSET_OVERRIDES,
    SearchParams.UNTRUSTED_ASSETS,
  ];

  const queryParams = new URLSearchParams(window.location.search);
  return sessionParams.reduce((result: SearchParams[], key) => {
    if (queryParams.has(key)) {
      return [...result, key];
    }

    return result;
  }, []);
};
