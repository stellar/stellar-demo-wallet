import { SearchParams } from "types/types.d";

const update = (searchParam: SearchParams, value: string) => {
  const queryParams = new URLSearchParams(window.location.search);
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

const remove = (searchParam: SearchParams, removeValue: string) => {
  const queryParams = new URLSearchParams(window.location.search);
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

export const searchParam = {
  update,
  remove,
};
