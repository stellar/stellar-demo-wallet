import { searchKeyPairStringToArray } from "helpers/searchKeyPairStringToArray";
import { SearchParams, SearchParamAsset, StringObject } from "types/types.d";

const update = (
  searchParam: SearchParams,
  value: string,
  urlSearchParams?: URLSearchParams,
) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(searchParam) || "";

  switch (searchParam) {
    case SearchParams.PUBNET:
      if (value === "true") {
        queryParams.set(SearchParams.PUBNET, value);
      } else {
        queryParams.delete(SearchParams.PUBNET);
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
      throw new Error(`Search param ${searchParam} does not exist`);
  }

  return `?${queryParams.toString()}`;
};

const remove = (
  searchParam: SearchParams,
  removeValue: string,
  urlSearchParams?: URLSearchParams,
) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(searchParam) || "";

  const updatedValue = updateValue({
    currentVal: currentParamValue,
    removeVal: removeValue,
  });

  if (updatedValue) {
    queryParams.set(searchParam, updatedValue);
  } else {
    queryParams.delete(searchParam);
  }

  return `?${queryParams.toString()}`;
};

type UpdateKeyPairProps = {
  searchParam: SearchParams;
  itemId: string;
  keyPairs: StringObject;
  urlSearchParams?: URLSearchParams;
};

const updateKeyPair = ({
  searchParam,
  itemId,
  keyPairs,
  urlSearchParams,
}: UpdateKeyPairProps) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(searchParam) || "";
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
        // TODO: any type
        `${asset.assetString}:${getKeyPairString(asset as any)}`,
      ],
      [],
    );

    queryParams.set(searchParam, updatedValuesString.join(","));
  } else {
    // Add new item
    const updatedValue = [
      ...valuesArray,
      `${itemId}|${getKeyPairString(keyPairs)}`,
    ].join(",");

    queryParams.set(searchParam, updatedValue);
  }

  return `?${queryParams.toString()}`;
};

const removeKeyPair = ({
  searchParam,
  itemId,
  urlSearchParams,
}: {
  searchParam: SearchParams;
  itemId: string;
  urlSearchParams?: URLSearchParams;
}) => {
  const queryParams =
    urlSearchParams || new URLSearchParams(window.location.search);
  const currentParamValue = queryParams.get(searchParam) || "";
  const assetArray = searchKeyPairStringToArray(currentParamValue);
  const assetsToKeep = assetArray.filter((v) => v.assetString !== itemId);

  if (assetsToKeep.length) {
    const updatedValuesString = assetsToKeep.reduce(
      (result: string[], asset) => [
        ...result,
        // TODO: any type
        `${asset.assetString}:${getKeyPairString(asset as any)}`,
      ],
      [],
    );

    queryParams.set(searchParam, updatedValuesString.join(","));
  } else {
    queryParams.delete(searchParam);
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

const getKeyPairString = (keyPairs: StringObject) => {
  const arr = Object.entries(keyPairs).reduce(
    (result: string[], [key, value]) => {
      if (key !== "assetString") {
        return [...result, `${key}:${value}`];
      }

      return result;
    },
    [],
  );

  return `${arr.join("|")}`;
};

export const searchParam = {
  update,
  remove,
  updateKeyPair,
  removeKeyPair,
};
