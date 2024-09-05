import { log } from "../../helpers/log";
import { AnchorPriceItem } from "../../types/types";

type Sep38Price = {
  token: string;
  anchorQuoteServerUrl: string | undefined;
  options: {
    /* eslint-disable camelcase */
    sell_asset: string;
    buy_asset: string;
    sell_amount?: string;
    buy_amount?: string;
    sell_delivery_method?: string;
    buy_delivery_method?: string;
    country_code?: string;
    context: "sep6" | "sep31";
    /* eslint-enable camelcase */
  };
};

export const getPrice = async ({
  token,
  anchorQuoteServerUrl,
  options,
}: Sep38Price): Promise<AnchorPriceItem> => {
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
    title: `Checking \`/price\` endpoint for \`${anchorQuoteServerUrl}\` to get price for selected asset`,
    ...(params ? { body: params } : {}),
  });

  log.request({
    title: "GET `/price`",
    ...(params ? { body: params } : {}),
  });

  const result = await fetch(
    `${anchorQuoteServerUrl}/price?${urlParams?.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (result.status !== 200) {
    const responseJson = await result.json();

    log.error({
      title: "GET `/price` failed",
      body: { status: result.status, ...responseJson },
    });

    throw new Error(responseJson.error ?? "Something went wrong");
  }

  const resultJson = await result.json();

  log.response({ title: "GET `/price`", body: resultJson });

  return resultJson;
};
