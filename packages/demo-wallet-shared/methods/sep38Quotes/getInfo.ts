import { log } from "../../helpers/log";
import { AnchorQuoteAsset } from "../../types/types";

export const getInfo = async (
  anchorQuoteServerUrl: string | undefined,
  options?: {
    /* eslint-disable camelcase */
    sell_asset: string;
    sell_amount: string;
    sell_delivery_method?: string;
    buy_delivery_method?: string;
    country_code?: string;
    /* eslint-enable camelcase */
  },
): Promise<{ assets: AnchorQuoteAsset[] }> => {
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
    title: `Checking \`/info\` endpoint for \`${anchorQuoteServerUrl}\` to get anchor quotes details`,
    ...(params ? { body: params } : {}),
  });

  log.request({
    title: "GET `/info`",
    ...(params ? { body: params } : {}),
  });

  const result = await fetch(
    `${anchorQuoteServerUrl}/info?${urlParams?.toString()}`,
  );
  const resultJson = await result.json();

  log.response({ title: "GET `/info`", body: resultJson });

  return resultJson;
};
