import { log } from "helpers/log";

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
      "We need to send the signed SEP10 challenge back to the server to get a JWT token to authenticate our stellar account with future actions",
  });

  log.request({ url: "POST /auth", body: params });

  const urlParams = new URLSearchParams(params);
  const result = await fetch(authEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: urlParams.toString(),
  });

  const resultJson = await result.json();
  log.response({ url: "POST /auth", body: resultJson });

  if (!resultJson.token) {
    throw new Error("No token returned from /auth");
  }

  console.log("Token is ", resultJson.token);

  return resultJson.token;
};
