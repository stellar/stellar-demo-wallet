import { Keypair } from "stellar-sdk";
import { log } from "../../helpers/log";

interface PutSep12FieldsRequestProps {
  secretKey: string;
  fields: any;
  memo?: string;
  token: string;
  kycServer: string;
  isSender?: boolean;
}

export const putSep12FieldsRequest = async ({
  secretKey,
  fields,
  memo,
  token,
  kycServer,
  isSender,
}: PutSep12FieldsRequestProps) => {
  const publicKey = Keypair.fromSecret(secretKey).publicKey();
  const data: { [key: string]: string } = {
    account: publicKey,
    ...(memo ? { memo, memo_type: "hash" } : {}),
    ...fields,
  };

  log.request({ title: "PUT `/customer`", body: data });

  const body = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    body.append(key, value.toString());
  });

  const result = await fetch(`${kycServer}/customer`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "PUT",
    body,
  });

  const resultJson = await result.json();
  if (isSender !== undefined) {
    log.response({
      title: `PUT \`/customer\` (${isSender ? "sender" : "receiver"})`,
      body: resultJson,
    });
  } else {
    log.response({
      title: `PUT \`/customer\``,
      body: resultJson,
    });
  }

  if (result.status !== 202) {
    throw new Error(
      `Unexpected status for PUT \`/customer\` request: ${result.status}`,
    );
  }

  return resultJson;
};
