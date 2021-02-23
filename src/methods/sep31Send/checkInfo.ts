import { isEmptyObject } from "helpers/isEmptyObject";
import { log } from "helpers/log";

export const checkInfo = async ({
  assetCode,
  sendServer,
}: {
  assetCode: string;
  sendServer: string;
}) => {
  log.instruction({
    title: "Check /info endpoint to see if we need to authenticate",
  });

  log.request({ title: "GET /info" });

  const result = await fetch(`${sendServer}/info`);
  const resultJson = await result.json();

  log.response({ title: "GET /info", body: resultJson });

  if (!resultJson.receive) {
    throw new Error("/info response needs a `receive` property");
  }

  const asset = resultJson.receive[assetCode];

  if (!asset) {
    throw new Error(`Could not find asset code ${assetCode} in /info response`);
  }

  if (!asset.enabled) {
    throw new Error(`${assetCode} is not enabled for deposit`);
  }

  if (!asset.fields || isEmptyObject(asset.fields)) {
    throw new Error("No `fields` object specified in /info");
  }

  if (!asset.fields.transaction || isEmptyObject(asset.fields.transaction)) {
    throw new Error("No transaction fields specified");
  }

  log.instruction({ title: `Send is enabled for asset ${assetCode}` });
  log.instruction({
    title: "The receiving anchor requires the following fields",
    body: asset.fields,
  });

  return {
    fields: asset.fields,
    senderSep12Type: asset.sender_sep12_type,
    receiverSep12Type: asset.receiver_sep12_type,
  };
};
