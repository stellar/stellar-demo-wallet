import { URL_KEY_PAIR_SEPARATOR_CHAR } from "../constants/settings";
import { SearchParamAsset } from "../types/types";

// eslint-disable-next-line max-len
// keyPairsString example:SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B|homeDomain>testanchor.stellar.org|someKey>someValue
export const searchKeyPairStringToArray = (
  keyPairString: string,
): SearchParamAsset[] => {
  const valuesArray = keyPairString ? keyPairString.split(",") : [];

  if (!valuesArray.length) {
    return [];
  }

  return valuesArray.reduce((result: SearchParamAsset[], item) => {
    const paramArr = item.split("|");
    const id = paramArr[0];
    const values = paramArr
      .splice(1, paramArr.length - 1)
      .reduce((paramRes, val) => {
        const [key, value] = val.split(URL_KEY_PAIR_SEPARATOR_CHAR);

        return { ...paramRes, [key]: value };
      }, {});

    return [...result, { assetString: id, ...values }];
  }, []);
};
