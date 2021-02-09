import crypto from "crypto";
import { Keypair } from "stellar-sdk";
import { log } from "helpers/log";

export const getSep12Fields = async ({
  kycServer,
  receiverSep12Type,
  secretKey,
  senderSep12Type,
  token,
}: {
  kycServer: string;
  receiverSep12Type: string;
  secretKey: string;
  senderSep12Type: string;
  token: string;
}) => {
  log.instruction({
    title: "Make GET /customer requests for sending and receiving user",
  });

  const result = {
    senderSep12Fields: null,
    receiverSep12Fields: null,
    info: {
      senderSep12Memo: "",
      receiverSep12Memo: "",
    },
  };

  if (senderSep12Type) {
    const memo = crypto.randomBytes(32).toString("base64");

    result.senderSep12Fields = await collectSep12Fields({
      type: senderSep12Type,
      memo,
      secretKey,
      token,
      kycServer,
    });

    result.info.senderSep12Memo = memo;
  }

  if (receiverSep12Type) {
    const memo = crypto.randomBytes(32).toString("base64");

    result.receiverSep12Fields = await collectSep12Fields({
      type: receiverSep12Type,
      memo,
      secretKey,
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
  secretKey,
  token,
  type,
}: {
  kycServer: string;
  memo: string;
  secretKey: string;
  token: string;
  type: string;
}) => {
  const publicKey = Keypair.fromSecret(secretKey).publicKey();
  // The anchor needs a memo to disambiguate the sending and receiving clients
  // since the wallet uses the same 'account' for both.
  const params = {
    type,
    account: publicKey,
    memo,
    memo_type: "hash",
  };

  log.request({ url: "GET /customer", body: params });

  const urlParams = new URLSearchParams(params);
  const result = await fetch(`${kycServer}/customer?${urlParams.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      // TODO: update URL
      Origin: "https://sep31-demo-client.netlify.app",
    },
  });
  const resultJson = await result.json();

  log.response({ url: "GET /customer", body: resultJson });

  if (resultJson.status !== "NEEDS_INFO") {
    throw new Error(`Unexpected status for new customer: ${resultJson.status}`);
  }

  return resultJson.fields;
};
