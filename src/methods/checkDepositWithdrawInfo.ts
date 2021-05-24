import { get } from "lodash";
import { log } from "helpers/log";
import { CheckInfoData, CheckInfoType } from "types/types.d";

export const checkDepositWithdrawInfo = async ({
  type,
  transferServerUrl,
  assetCode,
}: {
  type: CheckInfoType;
  transferServerUrl: string;
  assetCode: string;
}): Promise<CheckInfoData> => {
  log.instruction({
    title: `Checking \`/info\` endpoint to ensure this currency is enabled for ${
      type === CheckInfoType.DEPOSIT ? "deposit" : "withdrawal"
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
