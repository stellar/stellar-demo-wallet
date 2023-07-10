import { get } from "lodash";
import { log } from "../../helpers/log";
import { isNativeAsset } from "../../helpers/isNativeAsset";
import { AnchorActionType } from "../../types/types";

export const checkInfo = async ({
  type,
  toml,
  assetCode,
}: {
  type: AnchorActionType;
  toml: any;
  assetCode: string;
}) => {
  log.instruction({
    title: `Checking \`/info\` endpoint to ensure this currency is enabled for ${
      type === AnchorActionType.DEPOSIT ? "deposit" : "withdrawal"
    }`,
  });
  const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`;
  log.request({ title: `GET \`${infoURL}\`` });

  const info = await fetch(infoURL);
  const infoJson = await info.json();
  const isNative = isNativeAsset(assetCode);

  log.response({ title: `GET \`${infoURL}\``, body: infoJson });

  if (!get(infoJson, [type, isNative ? "native" : assetCode, "enabled"])) {
    throw new Error("Asset is not enabled in the `/info` endpoint");
  }

  return infoJson;
};
