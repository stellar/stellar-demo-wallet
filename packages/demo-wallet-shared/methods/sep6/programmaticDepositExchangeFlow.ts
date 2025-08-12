import { each } from "lodash";
import { log } from "../../helpers/log";
import { AnyObject } from "../../types/types";

type ProgrammaticDepositExchangeFlowProps = {
  amount: string;
  destinationAssetCode: string;
  sourceAsset: string;
  quoteId: string;
  account: string;
  transferServerUrl: string;
  token: string;
  type: string;
  depositFields: AnyObject;
  claimableBalanceSupported: boolean;
};

export const programmaticDepositExchangeFlow = async ({
  amount = "",
  destinationAssetCode,
  sourceAsset,
  quoteId,
  account,
  transferServerUrl,
  token,
  type,
  depositFields,
  claimableBalanceSupported,
}: ProgrammaticDepositExchangeFlowProps) => {
  log.instruction({
    title: "Starting SEP-6 programmatic flow for deposit-exchange",
  });

  const API_METHOD = "GET";
  const REQUEST_URL_STR = `${transferServerUrl}/deposit-exchange`;
  const REQUEST_URL = new URL(REQUEST_URL_STR);

  const getDepositParams = {
    amount,
    destination_asset: destinationAssetCode,
    source_asset: sourceAsset,
    quote_id: quoteId,
    account,
    claimable_balance_supported: claimableBalanceSupported.toString(),
    type,
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
