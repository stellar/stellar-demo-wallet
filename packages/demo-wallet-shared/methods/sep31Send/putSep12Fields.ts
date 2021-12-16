import { log } from "../../helpers/log";

import { putSep12FieldsRequest } from "../sep12";

interface PutSep12FieldsProps {
  formData: any;
  secretKey: string;
  senderMemo: string;
  receiverMemo: string;
  fields: any;
  token: string;
  kycServer: string;
}

export const putSep12Fields = async ({
  formData,
  secretKey,
  senderMemo,
  receiverMemo,
  fields,
  token,
  kycServer,
}: PutSep12FieldsProps) => {
  log.instruction({
    title: "Making PUT `/customer` requests for sending and receiving users",
  });

  const result = {
    senderSep12Id: "",
    receiverSep12Id: "",
  };

  if (fields.sender) {
    const resultJson = await putSep12FieldsRequest({
      secretKey,
      fields: formData.sender,
      memo: senderMemo,
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
      memo: receiverMemo,
      token,
      kycServer,
      isSender: false,
    });

    result.receiverSep12Id = resultJson.id;
  }

  return result;
};
