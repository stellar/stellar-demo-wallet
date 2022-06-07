import { each } from "lodash";
import { log } from "../../helpers/log";
import { AnyObject } from "../../types/types";

type InteractiveDepositFlowProps = {
  assetCode: string;
  publicKey: string;
  sep24TransferServerUrl: string;
  token: string;
  claimableBalanceSupported: boolean;
  memo?: string;
  memoType?: "text" | "id" | "hash";
  sep9Fields?: AnyObject;
};

type DepositParams = {
  [key: string]: any;
  /* eslint-disable camelcase */
  asset_code: string;
  account: string;
  lang: string;
  claimable_balance_supported: string;
  /* eslint-enable camelcase */
};

export const interactiveDepositFlow = async ({
  assetCode,
  publicKey,
  sep24TransferServerUrl,
  token,
  claimableBalanceSupported,
  memo,
  memoType,
  sep9Fields,
}: InteractiveDepositFlowProps) => {
  log.instruction({ title: "Starting SEP-24 interactive flow for deposit" });

  const formData = new FormData();
  const postDepositParams: DepositParams = {
    asset_code: assetCode,
    account: publicKey,
    lang: "en",
    claimable_balance_supported: claimableBalanceSupported.toString(),
    ...(memo && memoType ? { memo, memo_type: memoType } : {}),
    ...(sep9Fields ?? {}),
  };

  each(postDepositParams, (value, key) => formData.append(key, value));

  log.request({
    title: `POST \`${sep24TransferServerUrl}/transactions/deposit/interactive\``,
    body: postDepositParams,
  });

  const response = await fetch(
    `${sep24TransferServerUrl}/transactions/deposit/interactive`,
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
    title: `POST \`${sep24TransferServerUrl}/transactions/deposit/interactive\``,
    body: interactiveJson,
  });

  if (!interactiveJson.url) {
    throw new Error(
      "No URL returned from POST `/transactions/deposit/interactive`",
    );
  }

  return interactiveJson;
};
