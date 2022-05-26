import { each } from "lodash";
import { log } from "../../helpers/log";

type InteractiveDepositFlowProps = {
  assetCode: string;
  publicKey: string;
  sep24TransferServerUrl: string;
  token: string;
  claimableBalanceSupported: boolean;
  isCustodialMode?: boolean;
};

type DepositParams = {
  [key: string]: any;
  /* eslint-disable camelcase */
  asset_code: string;
  account: string;
  lang: string;
  claimable_balance_supported: string;
  memo?: string;
  memo_type?: "text" | "id" | "hash";
  /* eslint-enable camelcase */
};

export const interactiveDepositFlow = async ({
  assetCode,
  publicKey,
  sep24TransferServerUrl,
  token,
  claimableBalanceSupported,
  isCustodialMode,
}: InteractiveDepositFlowProps) => {
  log.instruction({ title: "Starting SEP-24 interactive flow for deposit" });

  const formData = new FormData();
  const postDepositParams: DepositParams = {
    asset_code: assetCode,
    account: publicKey,
    lang: "en",
    claimable_balance_supported: claimableBalanceSupported.toString(),
    ...(isCustodialMode
      ? { memo: Math.floor(Math.random() * 100).toString(), memo_type: "id" }
      : {}),
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
