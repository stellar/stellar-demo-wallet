import { each } from "lodash";
import { log } from "../../helpers/log";
import { AnyObject } from "../../types/types";

type ProgrammaticDepositFlowProps = {
  amount?: string;
  assetCode: string;
  publicKey: string;
  transferServerUrl: string;
  token: string;
  type: string;
  depositFields: AnyObject;
  claimableBalanceSupported: boolean;
};

export const programmaticDepositFlow = async ({
  amount = "",
  assetCode,
  publicKey,
  transferServerUrl,
  token,
  type,
  depositFields,
  claimableBalanceSupported,
}: ProgrammaticDepositFlowProps) => {
  log.instruction({ title: "Starting SEP-6 programmatic flow for deposit" });

  const API_METHOD = "GET";
  const REQUEST_URL_STR = `${transferServerUrl}/deposit`;
  const REQUEST_URL = new URL(REQUEST_URL_STR);

  const getDepositParams = {
    asset_code: assetCode,
    account: publicKey,
    claimable_balance_supported: claimableBalanceSupported.toString(),
    type,
    amount,
    ...depositFields,
  };

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

  const depositJson = await response.json();

  log.response({
    title: `${API_METHOD} \`${REQUEST_URL_STR}\``,
    body: depositJson,
  });

  return depositJson;
};
