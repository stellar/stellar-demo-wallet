import {
  URL_ITEM_SEPARATOR_CHAR,
  URL_KEY_PAIR_SEPARATOR_CHAR,
} from "../constants/settings";
import { searchKeyPairStringToArray } from "./searchKeyPairStringToArray";
import { SearchParams, SearchParamAsset, StringObject } from "../types/types";

const update = (
  param: SearchParams,
  value: string,
  urlSearchParams?: URLSearchParams,
) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(param) || "";

  switch (param) {
    case SearchParams.CLAIMABLE_BALANCE_SUPPORTED:
      if (value === "true") {
        queryParams.set(SearchParams.CLAIMABLE_BALANCE_SUPPORTED, value);
      } else {
        queryParams.delete(SearchParams.CLAIMABLE_BALANCE_SUPPORTED);
      }
      break;
    case SearchParams.SECRET_KEY:
      queryParams.set(SearchParams.SECRET_KEY, value);
      break;
    case SearchParams.UNTRUSTED_ASSETS:
      queryParams.set(
        SearchParams.UNTRUSTED_ASSETS,
        updateValue({ currentVal: currentParamValue, newVal: value }),
      );
      break;
    default:
      throw new Error(`Search param \`${searchParam}\` does not exist`);
  }

  return `?${queryParams.toString()}`;
};

const remove = (
  param: SearchParams,
  removeValue: string,
  urlSearchParams?: URLSearchParams,
) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(param) || "";

  const updatedValue = updateValue({
    currentVal: currentParamValue,
    removeVal: removeValue,
  });

  if (updatedValue) {
    queryParams.set(param, updatedValue);
  } else {
    queryParams.delete(param);
  }

  return `?${queryParams.toString()}`;
};

type UpdateKeyPairProps = {
  param: SearchParams;
  itemId: string;
  keyPairs: StringObject;
  urlSearchParams?: URLSearchParams;
};

const updateKeyPair = ({
  param,
  itemId,
  keyPairs,
  urlSearchParams,
}: UpdateKeyPairProps) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(param) || "";
  const valuesArray = currentParamValue ? currentParamValue.split(",") : [];

  const assetArray = searchKeyPairStringToArray(currentParamValue);
  const isExistingItem = assetArray.find((v) => v.assetString === itemId);

  // Update exisiting item
  if (isExistingItem) {
    // Example:
    // {
    //   SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B: {
    //     homeDomain: testanchor.stellar.org
    //   }
    // }
    const updatedValuesArray = assetArray.reduce(
      (result: SearchParamAsset[], asset) => {
        if (asset.assetString === itemId) {
          return [...result, { ...asset, ...keyPairs }];
        }

        return [...result, asset];
      },
      [],
    );

    const updatedValuesString = updatedValuesArray.reduce(
      (result: string[], asset) => [
        ...result,
        `${asset.assetString}${URL_ITEM_SEPARATOR_CHAR}${getKeyPairString(
          asset,
        )}`,
      ],
      [],
    );

    // eslint-disable-next-line max-len
    // We're building URL string back together here. Example: SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B|homeDomain>testanchor.stellar.org|someKey>someValue
    queryParams.set(param, updatedValuesString.join(","));
  } else {
    // Add new item
    const updatedValue = [
      ...valuesArray,
      `${itemId}${URL_ITEM_SEPARATOR_CHAR}${getKeyPairString(keyPairs)}`,
    ].join(",");

    queryParams.set(param, updatedValue);
  }

  return `?${queryParams.toString()}`;
};

const removeKeyPair = ({
  param,
  itemId,
  urlSearchParams,
}: {
  param: SearchParams;
  itemId: string;
  urlSearchParams?: URLSearchParams;
}) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(param) || "";
  const assetArray = searchKeyPairStringToArray(currentParamValue);
  const assetsToKeep = assetArray.filter((v) => v.assetString !== itemId);

  if (assetsToKeep.length) {
    const updatedValuesString = assetsToKeep.reduce(
      (result: string[], asset) => [
        ...result,
        `${asset.assetString}${URL_ITEM_SEPARATOR_CHAR}${getKeyPairString(
          asset,
        )}`,
      ],
      [],
    );

    // eslint-disable-next-line max-len
    // We're building URL string back together here. Example: SRT:GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B|homeDomain>testanchor.stellar.org|someKey>someValue
    queryParams.set(param, updatedValuesString.join(","));
  } else {
    queryParams.delete(param);
  }

  return `?${queryParams.toString()}`;
};

type UpdateValueProps = {
  currentVal: string;
  newVal?: string;
  removeVal?: string;
};

const updateValue = ({ currentVal, newVal, removeVal }: UpdateValueProps) => {
  const valuesArray = currentVal ? currentVal.split(",") : [];

  if (newVal) {
    if (valuesArray.includes(newVal)) {
      throw new Error(`${newVal} was already added`);
    }

    return [...valuesArray, newVal].join(",");
  }

  if (removeVal) {
    const valuesToKeep = valuesArray.filter((value) => value !== removeVal);
    return valuesToKeep.join(",");
  }

  return currentVal;
};

const getKeyPairString = (keyPairs: StringObject | SearchParamAsset) => {
  const arr = Object.entries(keyPairs).reduce(
    (result: string[], [key, value]) => {
      if (key !== "assetString") {
        return [...result, `${key}${URL_KEY_PAIR_SEPARATOR_CHAR}${value}`];
      }

      return result;
    },
    [],
  );

  // Returns key>value|key1>value1
  return `${arr.join(URL_ITEM_SEPARATOR_CHAR)}`;
};

export const searchParam = {
  update,
  remove,
  updateKeyPair,
  removeKeyPair,
};
