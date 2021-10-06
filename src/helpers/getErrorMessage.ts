import { getCatchError } from "@stellar/frontend-helpers";

export const getErrorMessage = (error: Error | unknown) => {
  const e = getCatchError(error);
  return e.message || e.toString();
};
