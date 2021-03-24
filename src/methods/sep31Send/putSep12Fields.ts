import { Keypair } from "stellar-sdk";
import { log } from "helpers/log";

interface PutSep12FieldsProps {
  formData: any;
  secretKey: string;
  senderSep12Memo: string;
  receiverSep12Memo: string;
  fields: any;
  token: string;
  kycServer: string;
}

export const putSep12Fields = async ({
  formData,
  secretKey,
  senderSep12Memo,
  receiverSep12Memo,
  fields,
  token,
  kycServer,
}: PutSep12FieldsProps) => {
  log.instruction({
    title: "Make PUT /customer requests for sending and receiving user",
  });

  const result = {
    senderSep12Id: "",
    receiverSep12Id: "",
  };

  if (fields.sender) {
    const resultJson = await putSep12FieldsRequest({
      secretKey,
      fields: formData.sender,
      memo: senderSep12Memo,
      token,
      kycServer,
      isSender: true,
    });

    result.senderSep12Id = resultJson.id;
  }

  if (fields.receiver) {
    const resultJson = await putSep12FieldsRequest({
      secretKey,
      fields: formData.receiver,
      memo: receiverSep12Memo,
      token,
      kycServer,
      isSender: false,
    });

    result.receiverSep12Id = resultJson.id;
  }

  return result;
};

interface PutSep12FieldsRequestProps {
  secretKey: string;
  fields: any;
  memo: string;
  token: string;
  kycServer: string;
  isSender: boolean;
}

const putSep12FieldsRequest = async ({
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
    memo_type: "hash",
    memo,
    ...fields,
  };

  log.request({ title: "PUT /customer", body: data });

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
  log.response({
    title: `PUT /customer (${isSender ? "sender" : "receiver"})`,
    body: resultJson,
  });

  if (result.status !== 202) {
    throw new Error(
      `Unexpected status for PUT /customer request: ${result.status}`,
    );
  }

  return resultJson;
};
