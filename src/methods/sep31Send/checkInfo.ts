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

  if (!asset.fields.transaction) {
    throw new Error("No `transaction` object specified in `fields`");
  }

  let senderSep12Type;
  let receiverSep12Type;

  if (asset.sep12) {
    if (asset.sep12.sender.types) {
      const senderTypes = Object.keys(asset.sep12.sender.types);
      senderSep12Type = senderTypes[0];

      log.instruction({
        title: `Found the following customer types for senders: ${senderTypes.join(
          ", ",
        )}`,
      });

      log.instruction({
        title: `Using ${senderTypes[0]}: ${
          asset.sep12.sender.types[senderTypes[0]].description
        }`,
      });
    }

    if (asset.sep12.receiver.types) {
      const receiverTypes = Object.keys(asset.sep12.receiver.types);
      receiverSep12Type = receiverTypes[0];

      log.instruction({
        title: `Found the following customer types for senders: ${receiverTypes.join(
          ", ",
        )}`,
      });

      log.instruction({
        title: `Using ${receiverTypes[0]}: ${
          asset.sep12.receiver.types[receiverTypes[0]].description
        }`,
      });
    }
  } else {
    senderSep12Type = asset.sender_sep12_type;
    receiverSep12Type = asset.receiver_sep12_type;

    if (senderSep12Type) {
      log.instruction({
        title: `Using ${senderSep12Type} type for sending customer`,
      });
    }
  }

  if (!senderSep12Type) {
    log.instruction({
      title: "The anchor does not require KYC for sending customers",
    });
  }

  if (!receiverSep12Type) {
    log.instruction({
      title: "The anchor does not require KYC for receiving customers",
    });
  }

  log.instruction({ title: `Send is enabled for asset ${assetCode}` });
  log.instruction({
    title: "The receiving anchor requires the following fields",
    body: asset.fields,
  });

  return {
    fields: asset.fields,
    senderSep12Type,
    receiverSep12Type,
  };
};
