import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StellarSdk, {
  Transaction,
  Keypair,
  StellarTomlResolver,
} from "stellar-sdk";
import { get } from "lodash";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { trustAsset } from "methods/trustAsset";
import {
  ActionStatus,
  DepositAssetInitialState,
  RejectMessage,
} from "types/types.d";

export const depositAssetAction = createAsyncThunk<
  { currentStatus: string; trustedAssetAdded?: string },
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "depositAsset/depositAssetAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(Boolean(pubnet));
    const server = new StellarSdk.Server(networkConfig.url);

    let trustedAssetAdded;
    const publicKey = data?.id;

    if (!publicKey) {
      return rejectWithValue({
        errorString: "Something is wrong with Account, no public key.",
      });
    }

    try {
      let homeDomain = null;

      // TODO: save domain name with untrusted asset, if it was provided
      // if (this.assets.get(`${asset_code}:${asset_issuer}`)) {
      //   homeDomain = this.assets.get(`${asset_code}:${asset_issuer}`).homeDomain
      // }

      if (!homeDomain) {
        console.log("Fetching issuer account from Horizon", assetIssuer);
        const accountRecord = await server
          .accounts()
          .accountId(assetIssuer)
          .call();

        // TODO: log this
        console.log(
          "response: ",
          "Fetching issuer account from Horizon",
          accountRecord,
        );

        homeDomain = accountRecord.home_domain;
      }

      if (!homeDomain) {
        // TODO: handle no domain case
        console.log("Need to provide home domain");
        // let inputs
        // try {
        //   inputs = await this.setPrompt({
        //     message: "Enter the anchor's home domain",
        //     inputs: [new PromptInput('anchor home domain (ex. example.com)')],
        //   })
        // } catch (e) {
        //   finish()
        //   return
        // }
        // homeDomain = inputs[0].value
      }

      homeDomain = homeDomain.startsWith("http")
        ? homeDomain
        : `https://${homeDomain}`;

      const tomlURL = new URL(homeDomain);
      tomlURL.pathname = "/.well-known/stellar.toml";
      // TODO: log this
      console.log("request", tomlURL.toString());

      const toml =
        tomlURL.protocol === "http:"
          ? await StellarTomlResolver.resolve(tomlURL.host, { allowHttp: true })
          : await StellarTomlResolver.resolve(tomlURL.host);

      // TODO: log this
      console.log(
        "instruction: ",
        `Received WEB_AUTH_ENDPOINT from TOML: ${toml.WEB_AUTH_ENDPOINT}`,
      );
      // TODO: log this
      console.log(
        "instruction: ",
        `Received TRANSFER_SERVER_SEP0024 from TOML: ${toml.TRANSFER_SERVER_SEP0024}`,
      );
      // TODO: log this
      console.log(
        "instruction: ",
        `Received asset issuer from TOML: ${toml.SIGNING_KEY}`,
      );

      if (
        !toml.SIGNING_KEY ||
        !toml.TRANSFER_SERVER_SEP0024 ||
        !toml.WEB_AUTH_ENDPOINT
      ) {
        throw new Error(
          "TOML must contain a SIGNING_KEY, TRANSFER_SERVER_SEP0024 and WEB_AUTH_ENDPOINT",
        );
      }

      // TODO: check if we need this check here
      // Set asset here because we have the homeDomain and toml contents,
      // but only if its trusted. (this.assets are considered trusted)
      // if (!this.untrustedAssets.has(`${asset_code}:${asset_issuer}`)) {
      //   this.assets.set(`${asset_code}:${asset_issuer}`, { homeDomain, toml });
      // }

      // TODO: log this
      console.log(
        "instruction",
        "Check /info endpoint to ensure this currency is enabled for deposit",
      );
      const infoURL = `${toml.TRANSFER_SERVER_SEP0024}/info`;
      // TODO: log this
      console.log("request", infoURL);

      const info = await fetch(infoURL);
      const infoJson = await info.json();
      // TODO: log this
      console.log("response", infoURL, infoJson);

      if (!get(infoJson, ["deposit", assetCode, "enabled"])) {
        throw new Error("Asset is not enabled in the /info endpoint");
      }

      // TODO: log this
      console.log(
        "instruction: ",
        "Deposit is enabled, and requires authentication so we should go through SEP-0010",
      );
      // TODO: log this
      console.log(
        "instruction: ",
        "Start the SEP-0010 flow to authenticate the wallet’s Stellar account",
      );

      const authParams = { account: publicKey };
      // TODO: log this
      console.log("request: ", toml.WEB_AUTH_ENDPOINT, authParams);

      const getChallengeURL = new URL(toml.WEB_AUTH_ENDPOINT);
      getChallengeURL.searchParams.set("account", publicKey);

      const challengeResponse = await fetch(getChallengeURL.toString());
      const challengeResponseJson = await challengeResponse.json();

      // TODO: log this
      console.log("response: ", toml.WEB_AUTH_ENDPOINT, challengeResponseJson);

      if (!challengeResponseJson.transaction)
        throw new Error(
          "The WEB_AUTH_ENDPOINT didn't return a challenge transaction",
        );
      // TODO: log this
      console.log(
        "instruction: ",
        "We’ve received a challenge transaction from the server that we need the client to sign with our Stellar account.",
      );

      const transaction: any = new Transaction(
        challengeResponseJson.transaction,
        challengeResponseJson.network_passphrase,
      );
      // TODO: log this
      console.log("request: ", "SEP-0010 Signed Transaction", transaction);

      const keypair = Keypair.fromSecret(secretKey);

      transaction.sign(keypair);

      // TODO: log this
      console.log("response: ", "Base64 Encoded", transaction.toXDR());
      // TODO: log this
      console.log(
        "instruction: ",
        "We need to send the signed SEP10 challenge back to the server to get a JWT token to authenticate our stellar account with future actions",
      );

      const jwtParams = { account: publicKey };
      // TODO: log this
      console.log("request: ", "POST /auth", jwtParams);

      const signedChallenge = transaction.toXDR();
      const tokenResponse = await fetch(`${toml.WEB_AUTH_ENDPOINT}`, {
        method: "POST",
        body: JSON.stringify({ transaction: signedChallenge }),
        headers: { "Content-Type": "application/json" },
      });
      const tokenResponseJson = await tokenResponse.json();

      // TODO: log this
      console.log("response: ", "POST /auth", tokenResponseJson);

      if (!tokenResponseJson.token) {
        throw new Error("No token was returned from POST /auth");
      }

      const auth = tokenResponseJson.token;
      const formData = new FormData();
      const postDepositParams = {
        asset_code: assetCode,
        account: publicKey,
        lang: "en",
        claimable_balance_supported: true,
      };

      Object.keys(postDepositParams).forEach((key) => {
        // TODO: fix TS
        // @ts-ignore
        formData.append(key, postDepositParams[key]);
      });

      // TODO: log this
      console.log(
        "request: ",
        `POST ${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
        postDepositParams,
      );

      let response = await fetch(
        `${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${auth}`,
          },
        },
      );

      const interactiveJson = await response.json();
      // TODO: log this
      console.log(
        "response: ",
        `${toml.TRANSFER_SERVER_SEP0024}/transactions/deposit/interactive`,
        interactiveJson,
      );

      if (!interactiveJson.url) {
        throw new Error(
          "No URL Returned from POST /transactions/deposit/interactive",
        );
      }

      const popupUrl = new URL(interactiveJson.url);
      const popup = open(popupUrl.toString(), "popup", "width=500,height=800");

      if (!popup) {
        throw new Error(
          "Popups are blocked. You’ll need to enable popups for this demo to work",
        );
      }

      let currentStatus = "incomplete";
      const transactionUrl = new URL(
        `${toml.TRANSFER_SERVER_SEP0024}/transaction?id=${interactiveJson.id}`,
      );
      // TODO: log this
      console.log(
        "instruction: ",
        `Polling for updates: ${transactionUrl.toString()}`,
      );

      while (!popup.closed && !["completed", "error"].includes(currentStatus)) {
        // eslint-disable-next-line no-await-in-loop
        response = await fetch(transactionUrl.toString(), {
          headers: { Authorization: `Bearer ${auth}` },
        });

        // eslint-disable-next-line no-await-in-loop
        const transactionJson = await response.json();

        if (transactionJson.transaction.status !== currentStatus) {
          currentStatus = transactionJson.transaction.status;
          popup.location.href = transactionJson.transaction.more_info_url;
          // TODO: log this
          console.log(
            "instruction: ",
            `Transaction ${interactiveJson.id} is in ${transactionJson.transaction.status} status`,
          );

          switch (currentStatus) {
            case "pending_user_transfer_start": {
              // TODO: log this
              console.log(
                "instruction: ",
                "The anchor is waiting on you to take the action described in the popup",
              );
              break;
            }
            case "pending_anchor": {
              // TODO: log this
              console.log(
                "instruction: ",
                "The anchor is processing the transaction",
              );
              break;
            }
            case "pending_stellar": {
              // TODO: log this
              console.log(
                "instruction: ",
                "The Stellar network is processing the transaction",
              );
              break;
            }
            case "pending_external": {
              // TODO: log this
              console.log(
                "instruction: ",
                "The transaction is being processed by an external system",
              );
              break;
            }
            case "pending_trust": {
              // TODO: log this
              console.log(
                "instruction: ",
                "You must add a trustline to the asset in order to receive your deposit",
              );
              // TODO: log this
              console.log("instruction: ", "Adding trustline...");
              try {
                const assetString = `${assetCode}:${assetIssuer}`;
                // eslint-disable-next-line no-await-in-loop
                await trustAsset({
                  server,
                  secretKey,
                  networkPassphrase: networkConfig.network,
                  untrustedAsset: {
                    assetString,
                    assetCode,
                    assetIssuer,
                  },
                });

                trustedAssetAdded = assetString;
              } catch (error) {
                throw new Error(error);
              }
              break;
            }
            case "pending_user": {
              // TODO: log this
              console.log(
                "instruction: ",
                "The anchor is waiting for you to take the action described in the popup",
              );
              break;
            }
            case "error": {
              // TODO: log this
              console.log(
                "instruction: ",
                "There was a problem processing your transaction",
              );
              break;
            }
            default:
            // do nothing
          }
        }

        // run loop every 2 seconds
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // TODO: log this
      console.log("instruction: ", `Transaction status: ${currentStatus}`);

      if (!["completed", "error"].includes(currentStatus) && popup.closed) {
        // TODO: log this
        console.log(
          "instruction: ",
          "The popup was closed before the transaction reached a terminal status, " +
            "if your balance is not updated soon, the transaction may have failed.",
        );
      }

      return {
        currentStatus,
        trustedAssetAdded,
      };
    } catch (error) {
      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

const initialState: DepositAssetInitialState = {
  data: {
    currentStatus: "",
    trustedAssetAdded: undefined,
  },
  status: undefined,
  errorString: undefined,
};

const depositAssetSlice = createSlice({
  name: "depositAsset",
  initialState,
  reducers: {
    resetDepositAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(depositAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(depositAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(depositAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = depositAssetSlice;
export const { resetDepositAssetAction } = depositAssetSlice.actions;
