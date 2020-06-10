import sjcl from "@tinyanvil/sjcl";
import copy from "copy-to-clipboard";

import { handleError } from "@services/error";

export default async function copySecret(e: Event) {
  try {
    e.preventDefault();

    const pincode = await this.setPrompt("Enter your keystore pincode");

    if (!pincode) return;

    this.error = null;

    const secret = sjcl.decrypt(pincode, this.account.keystore);
    copy(secret);
  } catch (err) {
    this.error = handleError(err);
  }
}
