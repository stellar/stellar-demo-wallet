import { get as loGet } from "lodash-es";

export function handleError(err: any) {
  return loGet(err, "response.data", loGet(err, "message", err));
}
