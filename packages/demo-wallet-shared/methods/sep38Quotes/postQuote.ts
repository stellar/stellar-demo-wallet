import { log } from "../../helpers/log";
import { AnchorQuote } from "../../types/types";

type Sep38QuoteRequest = {
  anchorQuoteServerUrl: string;
  token: string;
  /* eslint-disable camelcase */
  sell_asset: string;
  buy_asset: string;
  sell_amount?: string;
  buy_amount?: string;
  expire_after?: string;
  sell_delivery_method?: string;
  buy_delivery_method?: string;
  country_code?: string;
  /* eslint-enable camelcase */
  context: "sep6" | "sep31";
};

export const postQuote = async ({
  anchorQuoteServerUrl,
  token,
  /* eslint-disable camelcase */
  sell_asset,
  buy_asset,
  sell_amount,
  buy_amount,
  expire_after,
  sell_delivery_method,
  buy_delivery_method,
  country_code,
  /* eslint-disable camelcase */
  context,
}: Sep38QuoteRequest): Promise<AnchorQuote> => {
  const bodyObj = {
    sell_asset,
    buy_asset,
    sell_amount,
    buy_amount,
    expire_after,
    sell_delivery_method,
    buy_delivery_method,
    country_code,
    context,
  };

  log.request({
    title: "POST `/quote`",
    body: bodyObj,
  });

  const result = await fetch(`${anchorQuoteServerUrl}/quote`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyObj),
  });

  const resultJson = await result.json();

  log.response({ title: "POST `/quote`", body: resultJson });

  return resultJson;
};
