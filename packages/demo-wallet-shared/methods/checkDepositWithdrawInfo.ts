import { get } from "lodash";
import { log } from "../helpers/log";
import { CheckInfoData, AnchorActionType } from "../types/types";

export const checkDepositWithdrawInfo = async ({
  type,
  transferServerUrl,
  assetCode,
}: {
  type: AnchorActionType;
  transferServerUrl: string;
  assetCode: string;
}): Promise<CheckInfoData> => {
  log.instruction({
    title: `Checking \`/info\` endpoint to ensure this currency is enabled for ${
      type === AnchorActionType.DEPOSIT ? "deposit" : "withdrawal"
    }`,
  });
  const infoURL = `${transferServerUrl}/info`;
  log.request({ title: `GET \`${infoURL}\`` });

  const info = await fetch(infoURL);
  const infoJson = await info.json();
  log.response({ title: `GET \`${infoURL}\``, body: infoJson });

  if (!get(infoJson, [type, assetCode, "enabled"])) {
    throw new Error("Asset is not enabled in the `/info` endpoint");
  }

  return infoJson;
};
