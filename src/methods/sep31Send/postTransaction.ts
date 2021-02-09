import { log } from "helpers/log";

interface PostTransactionProps {
  token: string;
  sendServer: string;
  senderId: string;
  receiverId: string;
  transactionFormData: any;
  assetCode: string;
  amount: string;
}

export const postTransaction = async ({
  token,
  sendServer,
  senderId,
  receiverId,
  transactionFormData,
  assetCode,
  amount,
}: PostTransactionProps) => {
  log.instruction({
    title: "POST relevent field info to create a new payment",
  });

  const body = {
    sender_id: senderId,
    receiver_id: receiverId,
    fields: { transaction: transactionFormData },
    asset_code: assetCode,
    amount,
  };
  log.request({ url: "POST /transactions", body });

  const result = await fetch(`${sendServer}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (![200, 201].includes(result.status)) {
    throw new Error(
      `POST /transactions responded with status ${result.status}`,
    );
  }

  const resultJson = await result.json();
  log.response({ url: "POST /transactions", body: resultJson });

  const requiredProps = [
    "id",
    "stellar_account_id",
    "stellar_memo_type",
    "stellar_memo",
  ];

  requiredProps.forEach((prop) => {
    if (!resultJson[prop]) {
      throw new Error(`POST /transactions response missing property ${prop}`);
    }
  });

  return {
    sendMemoType: resultJson.stellar_memo_type,
    sendMemo: resultJson.stellar_memo,
    receiverAddress: resultJson.stellar_account_id,
    transactionId: resultJson.id,
  };
};
