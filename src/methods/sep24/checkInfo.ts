import { get } from "lodash";
import { log } from "helpers/log";
import { CheckInfoType } from "types/types.d";

export const checkInfo = async ({
  type,
  toml,
  assetCode,
}: {
  type: CheckInfoType;
  toml: any;
  assetCode: string;
}) => {
  log.instruction({
    title: `Checking \`/info\` endpoint to ensure this currency is enabled for ${
      type === CheckInfoType.DEPOSIT ? "deposit" : "withdrawal"
    }`,
  });
  const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`;
  log.request({ title: `GET \`${infoURL}\`` });

  const info = await fetch(infoURL);
  const infoJson = await info.json();
  log.response({ title: `GET \`${infoURL}\``, body: infoJson });

  if (!get(infoJson, [type, assetCode, "enabled"])) {
    throw new Error("Asset is not enabled in the `/info` endpoint");
  }

  return infoJson;
};
