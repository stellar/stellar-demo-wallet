import { log } from "../../helpers/log";
import { Sep9FieldsDict, Sep9FieldType } from "../../helpers/Sep9Fields";
import {
  Sep8ActionRequiredResultType,
  Sep8ActionRequiredSendParams,
  Sep8ActionRequiredSentResult,
} from "../../types/types";

export const sendActionRequiredFields = async ({
  actionFields,
  actionMethod,
  actionUrl,
}: Sep8ActionRequiredSendParams): Promise<Sep8ActionRequiredSentResult> => {
  log.request({
    title: `Sending action required fields to SEP-8 server with \`${actionMethod} ${actionUrl}\``,
    body: actionFields,
  });

  // prepare multipart request if needed
  let contentType = "application/json";
  let body: string | FormData = JSON.stringify(actionFields);
  const hasBinary = Object.keys(actionFields).some(
    (fieldName) => Sep9FieldsDict[fieldName].type === Sep9FieldType.BINARY,
  );

  if (hasBinary) {
    contentType = "multipart/form-data";

    const formData = new FormData();
    Object.entries(actionFields).forEach(([fieldName, fieldValue]) =>
      formData.append(fieldName, fieldValue),
    );
    body = formData;
  }

  const sep8ActionRequiredResult = await fetch(actionUrl, {
    method: actionMethod,
    headers: {
      "Content-Type": contentType,
    },
    body,
  });

  const resultJson = await sep8ActionRequiredResult.json();

  // parse result
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

  const defaultCompletionMessage =
    resultJson.result ===
    Sep8ActionRequiredResultType.NO_FURTHER_ACTION_REQUIRED
      ? "The SEP-8 server received your information, re-submitting the SEP-8 payment..."
      : "The SEP-8 server received your information, re-submit the SEP-8 payment.";

  log.instruction({
    title: validatedResponse.message ?? defaultCompletionMessage,
  });

  return validatedResponse;
};
