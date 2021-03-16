import { SearchParamAsset } from "types/types.d";

// keyPairsString example: SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B|homeDomain:testanchor.stellar.org|someKey:someValue
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
        const [key, value] = val.split(":");

        return { ...paramRes, [key]: value };
      }, {});

    return [...result, { assetString: id, ...values }];
  }, []);
};
