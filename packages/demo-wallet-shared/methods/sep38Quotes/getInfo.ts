import { log } from "../../helpers/log";
import { AnchorQuoteAsset } from "../../types/types";

type Sep38GetInfo = (
  | {
      context: "sep6";
      options?: undefined;
    }
  | {
      context: "sep31";
      options?: {
        /* eslint-disable camelcase */
        sell_asset: string;
        sell_amount: string;
        sell_delivery_method?: string;
        buy_delivery_method?: string;
        country_code?: string;
        /* eslint-enable camelcase */
      };
    }
) & {
  anchorQuoteServerUrl: string | undefined;
};

export const getInfo = async ({
  context,
  anchorQuoteServerUrl,
  options,
}: Sep38GetInfo): Promise<{ assets: AnchorQuoteAsset[] }> => {
  if (!anchorQuoteServerUrl) {
    throw new Error("Anchor quote server URL is required");
  }

  const params =
    context === "sep31" && options
      ? Object.entries(options).reduce((res: any, [key, value]) => {
          if (value) {
            res[key] = value;
          }

          return res;
        }, {})
      : undefined;
  const urlParams = params ? new URLSearchParams(params) : undefined;

  log.instruction({
    title: `Checking \`/info\` endpoint for \`${anchorQuoteServerUrl}\` to get anchor quotes details for ${context.toLocaleUpperCase()}`,
    ...(params ? { body: params } : {}),
  });

  log.request({
    title: "GET `/info`",
    ...(params ? { body: params } : {}),
  });

  const result = await fetch(
    `${anchorQuoteServerUrl}/info${
      urlParams ? `?${urlParams?.toString()}` : ""
    }`,
  );
  const resultJson = await result.json();

  log.response({ title: "GET `/info`", body: resultJson });

  return resultJson;
};
