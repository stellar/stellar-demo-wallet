import { isEmptyObject } from "../../helpers/isEmptyObject";
import { log } from "../../helpers/log";

export const checkInfo = async ({
  assetCode,
  sendServer,
}: {
  assetCode: string;
  sendServer: string;
}) => {
  log.instruction({
    title: "Checking `/info` endpoint to see if we need to authenticate",
  });

  log.request({ title: "GET `/info`" });

  const result = await fetch(`${sendServer}/info`);
  const resultJson = await result.json();

  log.response({ title: "GET `/info`", body: resultJson });

  if (!resultJson.receive) {
    throw new Error("`/info` response needs a `receive` property");
  }

  const asset = resultJson.receive[assetCode];

  if (!asset) {
    throw new Error(
      `Could not find asset code ${assetCode} in \`/info\` response`,
    );
  }

  if (!asset.enabled) {
    throw new Error(`${assetCode} is not enabled for deposit`);
  }

  if (!asset.fields || isEmptyObject(asset.fields)) {
    throw new Error("No `fields` object specified in `/info`");
  }

  if (!asset.fields.transaction) {
    throw new Error("No `transaction` object specified in `fields`");
  }

  let senderType;
  let receiverType;
  let multipleSenderTypes;
  let multipleReceiverTypes;

  if (asset.sep12) {
    // Sender
    if (asset.sep12.sender?.types) {
      const _senderTypes = Object.keys(asset.sep12.sender.types);

      if (_senderTypes.length === 1) {
        senderType = _senderTypes[0];

        log.instruction({
          title: `Using \`${senderType}\` ${asset.sep12.sender.types[senderType].description}`,
        });
      } else if (_senderTypes.length) {
        multipleSenderTypes = _senderTypes.map((s) => ({
          type: s,
          description: asset.sep12.sender.types[s].description,
        }));

        log.instruction({
          title: "Found multiple customer types for senders",
          body: `${_senderTypes.join(", ")}`,
        });
      }
    }

    // Receiver
    if (asset.sep12.receiver?.types) {
      const _receiverTypes = Object.keys(asset.sep12.receiver.types);

      if (_receiverTypes.length === 1) {
        receiverType = _receiverTypes[0];

        log.instruction({
          title: `Using \`${receiverType}\` ${asset.sep12.receiver.types[receiverType].description}`,
        });
      } else if (_receiverTypes.length) {
        multipleReceiverTypes = _receiverTypes.map((r) => ({
          type: r,
          description: asset.sep12.receiver.types[r].description,
        }));

        log.instruction({
          title: "Found multiple customer types for receivers",
          body: `${_receiverTypes.join(", ")}`,
        });
      }
    }
  } else {
    if (asset.sender_sep12_type) {
      senderType = asset.sender_sep12_type;

      log.instruction({
        title: `Using \`${senderType}\` type for sending customers`,
      });
    }

    if (asset.receiver_sep12_type) {
      receiverType = asset.receiver_sep12_type;

      log.instruction({
        title: `Using \`${receiverType}\` type for receiving customers`,
      });
    }
  }

  if (!senderType && !multipleSenderTypes) {
    log.instruction({
      title: "The anchor does not require KYC for sending customers",
    });
  }

  if (!receiverType && !multipleReceiverTypes) {
    log.instruction({
      title: "The anchor does not require KYC for receiving customers",
    });
  }

  log.instruction({ title: `Send is enabled for asset ${assetCode}` });
  log.instruction({
    title: "The receiving anchor requires the following fields",
    body: asset.fields,
  });

  // SEP-38 quotes
  const quotesSupported = Boolean(asset.quotes_supported);
  const quotesRequired = Boolean(asset.quotes_required);

  const quotesRequiredMessage = quotesSupported
    ? `${quotesRequired ? ", and it is required" : ", but it is not required"}`
    : "";

  log.instruction({
    title: `The receiving anchor ${
      quotesSupported ? "supports" : "does not support"
    } SEP-38 Anchor RFQ${quotesRequiredMessage}`,
  });

  return {
    fields: asset.fields,
    senderType,
    receiverType,
    multipleSenderTypes,
    multipleReceiverTypes,
    quotesSupported,
    quotesRequired,
  };
};
