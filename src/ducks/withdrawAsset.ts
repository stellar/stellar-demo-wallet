import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import StellarSdk, {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Memo,
  MemoHash,
  MemoID,
  MemoText,
  Operation,
  Transaction,
  TransactionBuilder,
  StellarTomlResolver,
} from "stellar-sdk";
import { each } from "lodash";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import {
  ActionStatus,
  RejectMessage,
  WithdrawAssetInitialState,
} from "types/types.d";

const getMemo = (memoString: string, memoType: string): Memo => {
  let memo;

  if (memoType === "hash") {
    memo = new Memo(
      MemoHash,
      Buffer.from(memoString, "base64").toString("hex"),
    );
  } else if (memoType === "id") {
    memo = new Memo(MemoID, memoString);
  } else if (memoType === "text") {
    memo = new Memo(MemoText, memoString);
  } else {
    throw new Error(`Invalid memo_type: ${memoString} (${memoType})`);
  }

  return memo;
};

export const withdrawAssetAction = createAsyncThunk<
  { currentStatus: string },
  { assetCode: string; assetIssuer: string },
  { rejectValue: RejectMessage; state: RootState }
>(
  "withdrawAsset/withdrawAssetAction",
  async ({ assetCode, assetIssuer }, { rejectWithValue, getState }) => {
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);
    const server = new StellarSdk.Server(networkConfig.url);

    const publicKey = data?.id;

    if (!publicKey) {
      throw new Error("Something is wrong with Account, no public key.");
    }

    try {
      const keypair = Keypair.fromSecret(secretKey);
      let homeDomain = null;

      // TODO: refactor home domain check into helper, deposit needs it as well

      // TODO: is this needed?
      // let homeDomain = this.assets.get(`${assetCode}:${assetIssuer}`)
      //   .homeDomain;

      if (!homeDomain) {
        log.request({
          title: "Fetching issuer account from Horizon",
          body: assetIssuer,
        });
        const accountRecord = await server.loadAccount(assetIssuer);

        log.response({
          title: "Fetching issuer account from Horizon",
          body: accountRecord,
        });

        homeDomain = accountRecord.home_domain;
      }

      if (!homeDomain) {
        // TODO: handle no domain case
        console.log("Need to provide home domain");
        throw new Error("Need to provide home domain");

        // let inputs;
        // try {
        //   inputs = await this.setPrompt({
        //     message: "Enter the anchor's home domain",
        //     inputs: [new PromptInput("anchor home domain (ex. example.com)")],
        //   });
        // } catch {
        //   finish();
        //   return;
        // }
        // homeDomain = inputs[0].value;
      }

      homeDomain = homeDomain.startsWith("http")
        ? homeDomain
        : `https://${homeDomain}`;

      const tomlURL = new URL(homeDomain);
      tomlURL.pathname = "/.well-known/stellar.toml";
      log.request({ title: tomlURL.toString() });

      const toml =
        tomlURL.protocol === "http:"
          ? await StellarTomlResolver.resolve(tomlURL.host, { allowHttp: true })
          : await StellarTomlResolver.resolve(tomlURL.host);
      log.response({ title: tomlURL.toString(), body: toml });

      // TODO: do we need to do this?
      // this.assets.set(`${assetCode}:${assetIssuer}`, { homeDomain, toml });

      const challenge = await fetch(
        `${toml.WEB_AUTH_ENDPOINT}?account=${publicKey}`,
      );
      const challengeJson = await challenge.json();

      const transaction = new Transaction(
        challengeJson.transaction,
        challengeJson.network_passphrase,
      );

      transaction.sign(keypair);

      const signedChallenge = transaction.toXDR();
      const token = await fetch(`${toml.WEB_AUTH_ENDPOINT}`, {
        method: "POST",
        body: JSON.stringify({ transaction: signedChallenge }),
        headers: { "Content-Type": "application/json" },
      });
      const tokenJson = await token.json();
      const auth = tokenJson.token;

      const formData = new FormData();
      each(
        {
          asset_code: assetCode,
          account: publicKey,
          lang: "en",
        },
        (value, key) => formData.append(key, value),
      );

      const interactive = await fetch(
        `${toml.TRANSFER_SERVER_SEP0024}/transactions/withdraw/interactive`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${auth}`,
          },
        },
      );
      const interactiveJson = await interactive.json();

      const urlBuilder = new URL(interactiveJson.url);
      const popup = open(
        urlBuilder.toString(),
        "popup",
        "width=500,height=800",
      );

      if (!popup) {
        throw new Error(
          "Popups are blocked. You'll need to enable popups for this demo to work",
        );
      }

      let currentStatus = "incomplete";
      const transactionUrl = new URL(
        `${toml.TRANSFER_SERVER_SEP0024}/transaction?id=${interactiveJson.id}`,
      );
      log.instruction({
        title: `Polling for updates: ${transactionUrl.toString()}`,
      });

      while (!popup.closed && !["completed", "error"].includes(currentStatus)) {
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(transactionUrl.toString(), {
          headers: { Authorization: `Bearer ${auth}` },
        });
        // eslint-disable-next-line no-await-in-loop
        const transactionJson = await response.json();

        if (transactionJson.transaction.status !== currentStatus) {
          currentStatus = transactionJson.transaction.status;
          popup.location.href = transactionJson.transaction.more_info_url;
          log.instruction({
            title: `Transaction ${interactiveJson.id} is in ${transactionJson.transaction.status} status`,
          });

          switch (currentStatus) {
            case "pending_user_transfer_start": {
              log.instruction({
                title:
                  "The anchor is waiting for you to send the funds for withdrawal",
              });

              const memo = getMemo(
                transactionJson.transaction.withdraw_memo,
                transactionJson.transaction.withdraw_memo_type,
              );

              log.request({
                title: "Fetching account sequence number",
                body: keypair.publicKey(),
              });

              // eslint-disable-next-line no-await-in-loop
              const { sequence } = await server
                .accounts()
                .accountId(keypair.publicKey())
                .call();

              log.response({
                title: "Fetching account sequence number",
                body: sequence,
              });

              const account = new Account(keypair.publicKey(), sequence);
              const txn = new TransactionBuilder(account, {
                fee: BASE_FEE,
                networkPassphrase: networkConfig.network,
              })
                .addOperation(
                  Operation.payment({
                    destination:
                      transactionJson.transaction.withdraw_anchor_account,
                    asset: new Asset(assetCode, assetIssuer),
                    amount: transactionJson.transaction.amount_in,
                  }),
                )
                .addMemo(memo)
                .setTimeout(0)
                .build();

              txn.sign(keypair);

              log.request({
                title: "Submitting withdrawal transaction to Stellar",
                body: txn,
              });

              // eslint-disable-next-line no-await-in-loop
              const horizonResponse = await server.submitTransaction(txn);
              log.response({
                title: "Submitting withdrawal transaction to Stellar",
                body: horizonResponse,
              });
              break;
            }
            case "pending_anchor": {
              log.instruction({
                title: "The anchor is processing the transaction",
              });
              break;
            }
            case "pending_stellar": {
              log.instruction({
                title: "The Stellar network is processing the transaction",
              });
              break;
            }
            case "pending_external": {
              log.instruction({
                title:
                  "The transaction is being processed by an external system",
              });
              break;
            }
            case "pending_user": {
              log.instruction({
                title:
                  "The anchor is waiting for you to take the action described in the popup",
              });
              break;
            }
            case "error": {
              log.instruction({
                title: "There was a problem processing your transaction",
              });
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
      log.instruction({ title: `Transaction status: ${currentStatus}` });
      if (!["completed", "error"].includes(currentStatus) && popup.closed) {
        log.instruction({
          title: `The popup was closed before the transaction reached a terminal status, if your balance is not updated soon, the transaction may have failed.`,
        });
      }

      return {
        currentStatus,
      };
    } catch (error) {
      log.error({
        title: "Withdrawal failed",
        body: error.toString(),
      });

      return rejectWithValue({
        errorString: error.toString(),
      });
    }
  },
);

const initialState: WithdrawAssetInitialState = {
  data: {
    currentStatus: "",
  },
  status: undefined,
  errorString: undefined,
};

const withdrawAssetSlice = createSlice({
  name: "withdrawAsset",
  initialState,
  reducers: {
    resetWithdrawAssetAction: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(withdrawAssetAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(withdrawAssetAction.fulfilled, (state, action) => {
      state.data = action.payload;
      state.status = ActionStatus.SUCCESS;
    });
    builder.addCase(withdrawAssetAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const { reducer } = withdrawAssetSlice;
export const { resetWithdrawAssetAction } = withdrawAssetSlice.actions;
