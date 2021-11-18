import crypto from "crypto";
import { log } from "../../helpers/log";
import { collectSep12Fields } from "../sep12/collectSep12Fields";

export const getSep12Fields = async ({
  kycServer,
  receiverType,
  publicKey,
  senderType,
  token,
}: {
  kycServer: string;
  receiverType: string | undefined;
  publicKey: string;
  senderType: string | undefined;
  token: string;
}) => {
  log.instruction({
    title: "Making GET `/customer` requests for sending and receiving users",
  });

  const result = {
    senderSep12Fields: null,
    receiverSep12Fields: null,
    info: {
      senderSep12Memo: "",
      receiverSep12Memo: "",
    },
  };

  if (senderType) {
    const memo = crypto.randomBytes(32).toString("base64");

    result.senderSep12Fields = await collectSep12Fields({
      type: senderType,
      memo,
      publicKey,
      token,
      kycServer,
      isNewCustomer: true,
    });

    result.info.senderSep12Memo = memo;
  }

  if (receiverType) {
    const memo = crypto.randomBytes(32).toString("base64");

    result.receiverSep12Fields = await collectSep12Fields({
      type: receiverType,
      memo,
      publicKey,
      token,
      kycServer,
      isNewCustomer: true,
    });

    result.info.receiverSep12Memo = memo;
  }

  return result;
};
