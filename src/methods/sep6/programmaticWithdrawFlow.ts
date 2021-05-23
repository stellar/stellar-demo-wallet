import { each } from "lodash";
import { log } from "helpers/log";
import { AnyObject } from "types/types";

type ProgrammaticWithdrawFlowProps = {
  assetCode: string;
  publicKey: string;
  transferServerUrl: string;
  token: string;
  type: string;
  withdrawFields: AnyObject;
  claimableBalanceSupported: boolean;
};

export const programmaticWithdrawFlow = async ({
  assetCode,
  publicKey,
  transferServerUrl,
  token,
  type,
  withdrawFields,
  claimableBalanceSupported,
}: ProgrammaticWithdrawFlowProps) => {
  log.instruction({ title: "Starting SEP-6 programmatic flow for withdrawal" });

  const API_METHOD = "GET";
  const REQUEST_URL_STR = `${transferServerUrl}/withdraw`;
  const REQUEST_URL = new URL(REQUEST_URL_STR);

  const getDepositParams = {
    asset_code: assetCode,
    account: publicKey,
    claimable_balance_supported: claimableBalanceSupported.toString(),
    type,
    ...withdrawFields,
  };
  console.log(withdrawFields);
  console.log(getDepositParams);

  each(getDepositParams, (value, key) =>
    REQUEST_URL.searchParams.append(key, value),
  );

  log.request({
    title: `${API_METHOD} \`${REQUEST_URL_STR}\``,
    body: getDepositParams,
  });

  const response = await fetch(`${REQUEST_URL}`, {
    method: API_METHOD,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const withdrawJson = await response.json();

  if (response.status !== 200) {
    throw new Error(withdrawJson.error);
  }

  log.response({
    title: `${API_METHOD} \`${REQUEST_URL_STR}\``,
    body: withdrawJson,
  });

  return withdrawJson;
};
