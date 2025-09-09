import { log } from "../../helpers/log";

export const start = async ({
  authEndpoint,
  contractAddress,
  homeDomain,
  clientDomain,
}: {
  authEndpoint: string;
  contractAddress: string;
  homeDomain: string;
  clientDomain: string ;
}) => {
  const params = {
    account: contractAddress,
    home_domain: homeDomain,
    ...(clientDomain && { client_domain: clientDomain }),
  };
  log.instruction({
    title:
      "Starting the SEP-45 flow",
  });

  log.request({ title: "GET `/sep45/auth`", body: params });

  const authURL = new URL(authEndpoint);
  Object.entries(params).forEach(([key, value]) => {
    authURL.searchParams.append(key, value);
  });

  const response = await fetch(authURL.toString())
  if (!response.ok) {
    throw new Error(`${response.status} Error getting SEP-45 challenge`);
  }

  const responseJson = await response.json();
  const { authorizationEntries, networkPassphrase } = responseJson;
  if (!authorizationEntries || !networkPassphrase) {
    throw new Error("Invalid response from server");
  }

  log.response({ title: "GET `/sep45/auth`", body: responseJson });
  return { authorizationEntries, networkPassphrase };
}