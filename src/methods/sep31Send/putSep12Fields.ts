import { Keypair } from "stellar-sdk";
import { log } from "helpers/log";

interface PutSep12FieldsProps {
  formData: any;
  secretKey: string;
  senderSep12Memo: string;
  receiverSep12Memo: string;
  sep12Fields: any;
  token: string;
  kycServer: string;
}

export const putSep12Fields = async ({
  formData,
  secretKey,
  senderSep12Memo,
  receiverSep12Memo,
  sep12Fields,
  token,
  kycServer,
}: PutSep12FieldsProps) => {
  log.instruction({
    title: "Make PUT /customer requests for sending and receiving user",
  });

  const response = {
    senderSep12Id: "",
    receiverSep12Id: "",
  };

  if (sep12Fields.senderSep12Fields) {
    const responseJSON = await putSEP12Fields({
      secretKey,
      fields: formData.sender,
      memo: senderSep12Memo,
      token,
      kycServer,
      isSender: true,
    });

    response.senderSep12Id = responseJSON.id;
  }

  if (sep12Fields.receiverSep12Fields) {
    const responseJSON = await putSEP12Fields({
      secretKey,
      fields: formData.receiver,
      memo: receiverSep12Memo,
      token,
      kycServer,
      isSender: false,
    });

    response.receiverSep12Id = responseJSON.id;
  }

  return response;
};

interface PutSEP12FieldsProps {
  secretKey: string;
  fields: any;
  memo: string;
  token: string;
  kycServer: string;
  isSender: boolean;
}

const putSEP12Fields = async ({
  secretKey,
  fields,
  memo,
  token,
  kycServer,
  isSender,
}: PutSEP12FieldsProps) => {
  const publicKey = Keypair.fromSecret(secretKey).publicKey();
  const data: { [key: string]: string } = {
    account: publicKey,
    memo_type: "hash",
    memo,
    ...fields,
  };

  log.request({ url: "PUT /customer", body: data });

  const body = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    body.append(key, value.toString());
  });

  const response = await fetch(`${kycServer}/customer`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method: "PUT",
    body,
  });

  const responseJson = await response.json();
  log.response({
    url: `PUT /customer (${isSender ? "sender" : "receiver"})`,
    body: responseJson,
  });

  if (response.status !== 202) {
    throw new Error(
      `Unexpected status for PUT /customer request: ${response.status}`,
    );
  }

  return responseJson;
};
