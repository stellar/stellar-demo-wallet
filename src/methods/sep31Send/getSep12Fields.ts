import crypto from "crypto";
import { log } from "helpers/log";

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
    });

    result.info.receiverSep12Memo = memo;
  }

  return result;
};

const collectSep12Fields = async ({
  kycServer,
  memo,
  publicKey,
  token,
  type,
}: {
  kycServer: string;
  memo: string;
  publicKey: string;
  token: string;
  type: string;
}) => {
  // The anchor needs a memo to disambiguate the sending and receiving clients
  // since the wallet uses the same 'account' for both.
  const params = {
    type,
    account: publicKey,
    memo,
    memo_type: "hash",
  };

  log.request({ title: "GET `/customer`", body: params });

  const urlParams = new URLSearchParams(params);
  const result = await fetch(`${kycServer}/customer?${urlParams.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: "https://demo-wallet.stellar.org",
    },
  });
  const resultJson = await result.json();

  log.response({ title: "GET `/customer`", body: resultJson });

  if (resultJson.status !== "NEEDS_INFO") {
    throw new Error(
      `Unexpected status for new customer \`${resultJson.status}\``,
    );
  }

  log.instruction({
    title: "Received the following fields",
    body: resultJson.fields,
  });

  return resultJson.fields;
};
