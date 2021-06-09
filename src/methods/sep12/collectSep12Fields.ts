import { log } from "helpers/log";

export const collectSep12Fields = async ({
  kycServer,
  memo,
  publicKey,
  token,
  type,
  isNewCustomer,
}: {
  kycServer: string;
  memo?: string;
  publicKey: string;
  token: string;
  type?: string;
  isNewCustomer?: boolean;
}) => {
  // The anchor needs a memo to disambiguate the sending and receiving clients
  // since the wallet uses the same 'account' for both.
  const params = {
    ...(type ? { type } : {}),
    account: publicKey,
    ...(memo ? { memo, memo_type: "hash" } : {}),
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

  if (isNewCustomer && resultJson.status !== "NEEDS_INFO") {
    throw new Error(
      `Unexpected status for new customer \`${resultJson.status}\``,
    );
  }

  if (resultJson.fields) {
    log.instruction({
      title: "Received the following fields",
      body: resultJson.fields,
    });
  }

  return resultJson.fields;
};
