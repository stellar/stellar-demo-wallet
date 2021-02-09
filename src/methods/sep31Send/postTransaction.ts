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

  const response = await fetch(`${sendServer}/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.status !== 200) {
    throw new Error(
      `POST /transactions responded with status ${response.status}`,
    );
  }

  const responseJson = await response.json();
  log.response({ url: "POST /transactions", body: responseJson });

  const requiredProps = [
    "id",
    "stellar_account_id",
    "stellar_memo_type",
    "stellar_memo",
  ];

  requiredProps.forEach((prop) => {
    if (!responseJson[prop]) {
      throw new Error(`POST /transactions response missing property ${prop}`);
    }
  });

  return {
    sendMemoType: responseJson.stellar_memo_type,
    sendMemo: responseJson.stellar_memo,
    receiverAddress: responseJson.stellar_account_id,
    transactionId: responseJson.id,
  };
};
