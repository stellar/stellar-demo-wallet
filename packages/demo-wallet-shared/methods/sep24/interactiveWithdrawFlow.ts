import { each } from "lodash";
import { log } from "../../helpers/log";
import { AnyObject } from "../../types/types";

export const interactiveWithdrawFlow = async ({
  assetCode,
  publicKey,
  sep24TransferServerUrl,
  token,
  sep9Fields,
}: {
  assetCode: string;
  publicKey: string;
  sep24TransferServerUrl: string;
  token: string;
  sep9Fields?: AnyObject;
}) => {
  log.instruction({ title: "Starting SEP-24 interactive flow for withdrawal" });

  const formData = new FormData();
  const postWithdrawParams = {
    asset_code: assetCode,
    account: publicKey,
    lang: "en",
    ...(sep9Fields ?? {}),
  };

  each(postWithdrawParams, (value, key) => formData.append(key, value));

  log.request({
    title: `POST \`${sep24TransferServerUrl}/transactions/withdraw/interactive\``,
    body: postWithdrawParams,
  });

  const response = await fetch(
    `${sep24TransferServerUrl}/transactions/withdraw/interactive`,
    {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const interactiveJson = await response.json();

  log.response({
    title: `POST \`${sep24TransferServerUrl}/transactions/withdraw/interactive\``,
    body: interactiveJson,
  });

  if (!interactiveJson.url) {
    throw new Error(
      "No URL returned from POST `/transactions/withdraw/interactive`",
    );
  }

  return interactiveJson;
};
