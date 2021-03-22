import { Utils } from "stellar-sdk";
import { log } from "helpers/log";

export const start = async ({
  authEndpoint,
  serverSigningKey,
  publicKey,
  homeDomain,
}: {
  authEndpoint: string;
  serverSigningKey: string;
  publicKey: string;
  homeDomain: string;
}) => {
  const params = { account: publicKey, homeDomain };

  log.instruction({
    title:
      "Start the SEP-0010 flow to authenticate the sending anchor's Stellar account",
  });

  log.request({ title: "GET /auth", body: params });

  const authURL = new URL(authEndpoint);
  Object.entries(params).forEach(([key, value]) => {
    authURL.searchParams.append(key, value);
  });

  const result = await fetch(authURL.toString());
  const resultJson = await result.json();
  log.response({ title: "GET /auth", body: resultJson });

  if (!resultJson.transaction) {
    throw new Error("The response didn't contain a transaction");
  }

  const { tx } = Utils.readChallengeTx(
    resultJson.transaction,
    serverSigningKey,
    resultJson.network_passphrase,
    homeDomain,
    authURL.host,
  );

  return tx;
};
