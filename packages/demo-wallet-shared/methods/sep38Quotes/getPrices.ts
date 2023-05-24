import { log } from "../../helpers/log";
import { AnchorBuyAsset } from "../../types/types";

type Sep38Prices = {
  token: string;
  anchorQuoteServerUrl: string | undefined;
  options?: {
    /* eslint-disable camelcase */
    sell_asset: string;
    sell_amount: string;
    sell_delivery_method?: string;
    buy_delivery_method?: string;
    country_code?: string;
    /* eslint-enable camelcase */
  };
};

export const getPrices = async ({
  token,
  anchorQuoteServerUrl,
  options,
}: Sep38Prices): // eslint-disable-next-line camelcase
Promise<{ buy_assets: AnchorBuyAsset[] }> => {
  if (!anchorQuoteServerUrl) {
    throw new Error("Anchor quote server URL is required");
  }

  const params = options
    ? Object.entries(options).reduce((res: any, [key, value]) => {
        if (value) {
          res[key] = value;
        }

        return res;
      }, {})
    : undefined;
  const urlParams = params ? new URLSearchParams(params) : undefined;

  log.instruction({
    title: `Checking \`/prices\` endpoint for \`${anchorQuoteServerUrl}\` to get prices for selected asset`,
    ...(params ? { body: params } : {}),
  });

  log.request({
    title: "GET `/prices`",
    ...(params ? { body: params } : {}),
  });

  const result = await fetch(
    `${anchorQuoteServerUrl}/prices?${urlParams?.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (result.status !== 200) {
    log.error({
      title: "GET `/prices` failed",
      body: { status: result.status },
    });

    throw new Error("Something went wrong");
  }

  const resultJson = await result.json();

  log.response({ title: "GET `/prices`", body: resultJson });

  return resultJson;
};
