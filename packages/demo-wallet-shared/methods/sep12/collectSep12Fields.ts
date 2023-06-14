import { log } from "../../helpers/log";
import {
  Sep12CustomerStatus,
  Sep12CustomerFieldStatus,
} from "../../types/types";

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

  if (
    isNewCustomer &&
    ![Sep12CustomerStatus.NEEDS_INFO, Sep12CustomerStatus.ACCEPTED].includes(
      resultJson.status,
    )
  ) {
    throw new Error(
      `Unexpected status for new customer \`${resultJson.status}\``,
    );
  }

  const fieldsToCollect = Object.entries(resultJson.fields ?? {}).reduce(
    (collectResult: any, field: any) => {
      const [key, props] = field;

      if (
        !props.status ||
        props.status === Sep12CustomerFieldStatus.NOT_PROVIDED ||
        (props.status === Sep12CustomerFieldStatus.REJECTED &&
          resultJson.status === Sep12CustomerStatus.NEEDS_INFO)
      ) {
        return { ...collectResult, [key]: props };
      }

      return collectResult;
    },
    {},
  );

  if (resultJson.fields) {
    log.instruction({
      title: "Received the following customer fields",
      body: resultJson.fields,
    });
  }

  if (Object.keys(fieldsToCollect).length) {
    log.instruction({
      title: "The following customer fields must be submitted",
      body: fieldsToCollect,
    });
  } else {
    log.instruction({
      title: "No customer fields need to be submitted",
    });
  }

  return fieldsToCollect;
};
