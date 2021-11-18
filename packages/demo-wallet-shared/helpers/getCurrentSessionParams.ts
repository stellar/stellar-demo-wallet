import { SearchParams } from "../types/types";

export const getCurrentSessionParams = () => {
  const sessionParams = [
    SearchParams.ASSET_OVERRIDES,
    SearchParams.UNTRUSTED_ASSETS,
    SearchParams.CLAIMABLE_BALANCE_SUPPORTED,
  ];

  const queryParams = new URLSearchParams(window.location.search);
  return sessionParams.reduce((result: SearchParams[], key) => {
    if (queryParams.has(key)) {
      return [...result, key];
    }

    return result;
  }, []);
};
