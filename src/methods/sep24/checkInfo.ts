import { get } from "lodash";
import { log } from "helpers/log";

export const checkInfo = async ({
  toml,
  assetCode,
}: {
  toml: any;
  assetCode: string;
}) => {
  // TODO: deposit hard coded
  log.instruction({
    title:
      "Check /info endpoint to ensure this currency is enabled for deposit",
  });
  const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`;
  log.request({ title: infoURL });

  const info = await fetch(infoURL);
  const infoJson = await info.json();
  log.response({ title: infoURL, body: infoJson });

  if (!get(infoJson, ["deposit", assetCode, "enabled"])) {
    throw new Error("Asset is not enabled in the /info endpoint");
  }

  return infoJson;
};
