import { log } from "helpers/log";
import { Sep8ActionRequiredResult } from "types/types.d";

export const sendActionRequiredFields = async ({
  actionFields,
  actionMethod,
  actionUrl,
}: {
  actionFields: { [key: string]: string };
  actionMethod: string;
  actionUrl: string;
}): Promise<Sep8ActionRequiredResult> => {
  log.request({
    title: `Sending action required fields to SEP-8 server with ${actionMethod} ${actionUrl}`,
    body: actionFields,
  });
  const sep8ActionRequiredResult = await fetch(actionUrl, {
    method: actionMethod,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(actionFields),
  });
  const resultJson = await sep8ActionRequiredResult.json();

  let validatedResponse: Sep8ActionRequiredResult;
  switch (resultJson.result) {
    case "no_further_action_required":
      validatedResponse = {
        result: "no_further_action_required",
      };
      break;

    case "follow_next_url":
      if (!resultJson.next_url) {
        throw new Error(`Missing "next_url" parameter`);
      }
      validatedResponse = {
        result: "follow_next_url",
        nextUrl: resultJson.next_url,
      };

      if (resultJson.message) {
        validatedResponse.message = resultJson.message;
      }
      break;

    default:
      throw new Error(`Unexpected result: ${resultJson}`);
  }

  log.response({
    title: "Action Required Response",
    body: resultJson,
  });

  return validatedResponse;
};
