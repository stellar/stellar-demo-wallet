import { log } from "../../helpers/log";

export const send = async ({
  authEndpoint,
  signedChallengeTransaction,
}: {
  authEndpoint: string;
  signedChallengeTransaction: any;
}) => {
  const params = {
    transaction: signedChallengeTransaction.toEnvelope().toXDR("base64"),
  };

  log.instruction({
    title:
      "We need to send the signed SEP-10 challenge back to the server to get a JWT token to authenticate our Stellar account with future actions",
  });

  log.request({ title: "POST `/auth`", body: params });

  const urlParams = new URLSearchParams(params);
  const result = await fetch(authEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: urlParams.toString(),
  });

  const resultJson = await result.json();
  log.response({ title: "POST `/auth`", body: resultJson });

  if (!resultJson.token) {
    throw new Error("No token returned from `/auth`");
  }

  return resultJson.token;
};
