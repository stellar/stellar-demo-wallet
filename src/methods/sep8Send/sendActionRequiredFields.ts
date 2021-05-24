import { log } from "helpers/log";
import {
  Sep8ActionRequiredResultType,
  Sep8ActionRequiredSendParams,
  Sep8ActionRequiredSentResult,
} from "types/types.d";

export const sendActionRequiredFields = async ({
  actionFields,
  actionMethod,
  actionUrl,
}: Sep8ActionRequiredSendParams): Promise<Sep8ActionRequiredSentResult> => {
  log.request({
    title: `Sending action required fields to SEP-8 server with \`${actionMethod} ${actionUrl}\``,
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

  let validatedResponse: Sep8ActionRequiredSentResult;
  switch (resultJson.result) {
    case Sep8ActionRequiredResultType.NO_FURTHER_ACTION_REQUIRED:
      validatedResponse = {
        result: Sep8ActionRequiredResultType.NO_FURTHER_ACTION_REQUIRED,
      };
      break;

    case Sep8ActionRequiredResultType.FOLLOW_NEXT_URL:
      if (!resultJson.next_url) {
        throw new Error(`Missing "next_url" parameter.`);
      }
      validatedResponse = {
        result: Sep8ActionRequiredResultType.FOLLOW_NEXT_URL,
        nextUrl: resultJson.next_url,
      };

      if (resultJson.message) {
        validatedResponse.message = resultJson.message;
      }
      break;

    default:
      throw new Error(`Unexpected result: ${JSON.stringify(resultJson)}`);
  }

  log.response({
    title: "Action Required Response",
    body: resultJson,
  });

  if (validatedResponse.message) {
    log.instruction({
      title: validatedResponse.message,
    });
  } else {
    log.instruction({
      title:
        "The SEP-8 server received your information, re-submit the SEP-8 payment.",
    });
  }

  return validatedResponse;
};
