import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { checkTomlForFields } from "demo-wallet-shared/build/methods/checkTomlForFields";
import { checkDepositWithdrawInfo } from "demo-wallet-shared/build/methods/checkDepositWithdrawInfo";
import {
  sep10AuthSend,
  sep10AuthSign,
  sep10AuthStart,
} from "demo-wallet-shared/build/methods/sep10Auth";
import {
  getInfo,
  getPrice,
  postQuote,
} from "demo-wallet-shared/build/methods/sep38Quotes";
import {
  pollWithdrawUntilComplete,
  programmaticWithdrawExchangeFlow,
  programmaticWithdrawFlow,
} from "demo-wallet-shared/build/methods/sep6";
import {
  collectSep12Fields,
  putSep12FieldsRequest,
} from "demo-wallet-shared/build/methods/sep12";

import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { normalizeHomeDomainUrl } from "demo-wallet-shared/build/helpers/normalizeHomeDomainUrl";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { AnchorPriceItem } from "demo-wallet-shared/build/types/types";

import { clientDomain, RootState, walletBackendEndpoint } from "config/store";
import { sanitizeObject } from "helpers/sanitizeObject";

import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";

import {
  ActionStatus,
  AnchorActionType,
  AnchorQuote,
  AnyObject,
  Asset,
  RejectMessage,
  Sep12CustomerStatus,
  Sep6WithdrawAssetInitialState,
  Sep6WithdrawResponse,
  TomlFields,
  TransactionStatus,
} from "types/types";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";

type InitiateWithdrawActionPayload = Sep6WithdrawAssetInitialState["data"] & {
  status: ActionStatus;
};

export const initiateWithdrawAction = createAsyncThunk<
  InitiateWithdrawActionPayload,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/initiateWithdrawAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;
    const { data, secretKey } = accountSelector(getState());
    const networkConfig = getNetworkConfig();
    const publicKey = data?.id;

    // This is unlikely
    if (!publicKey) {
      throw new Error("Something is wrong with Account, no public key.");
    }

    // This is unlikely
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    log.instruction({ title: "Initiating a SEP-6 withdrawal" });

    try {
      // Check toml
      const tomlResponse = await checkTomlForFields({
        sepName: "SEP-6 withdrawal",
        assetIssuer,
        requiredKeys: [TomlFields.TRANSFER_SERVER],
        networkUrl: networkConfig.url,
        homeDomain,
      });

      // Check info
      const infoData = await checkDepositWithdrawInfo({
        type: AnchorActionType.WITHDRAWAL,
        transferServerUrl: tomlResponse.TRANSFER_SERVER,
        assetCode,
      });

      const sellAsset = isNativeAsset(assetCode)
        ? "stellar:native"
        : `stellar:${assetCode}:${assetIssuer}`;

      let anchorQuoteServer;
      let withdrawAssets;

      const supportsQuotes = Boolean(infoData["withdraw-exchange"]);

      // Check SEP-38 quote server key in toml, if supported
      if (supportsQuotes) {
        const tomlSep38Response = await checkTomlForFields({
          sepName: "SEP-38 Anchor RFQ",
          assetIssuer,
          requiredKeys: [TomlFields.ANCHOR_QUOTE_SERVER],
          networkUrl: networkConfig.url,
          homeDomain,
        });

        anchorQuoteServer = tomlSep38Response.ANCHOR_QUOTE_SERVER;
      }

      if (anchorQuoteServer) {
        log.instruction({ title: "Anchor supports SEP-38 quotes" });

        const quotesResult = await getInfo({
          context: "sep6",
          anchorQuoteServerUrl: anchorQuoteServer,
        });

        withdrawAssets = quotesResult.assets.filter(
          (a) => a.asset !== sellAsset && a.buy_delivery_methods,
        );

        log.instruction({
          title: "Supported SEP-38 assets for withdrawal",
          body: withdrawAssets,
        });
      }

      const actionType =
        supportsQuotes && withdrawAssets && withdrawAssets?.length > 0
          ? AnchorActionType.WITHDRAW_EXCHANGE
          : AnchorActionType.WITHDRAWAL;

      log.instruction({
        title: `Selected ${actionType} path`,
      });

      // Get either withdarw or withdraw-exchange asset data
      const assetInfoData =
        infoData[actionType]?.[isNativeAsset(assetCode) ? "native" : assetCode];

      // This is unlikely
      if (!assetInfoData) {
        throw new Error(
          `Something went wrong, withdraw asset ${assetCode} is not configured.`,
        );
      }

      const {
        authentication_required: isAuthenticationRequired,
        min_amount: minAmount,
        max_amount: maxAmount,
      } = assetInfoData;

      let payload = {
        assetCode,
        assetIssuer,
        withdrawTypes: { types: { ...assetInfoData.types } },
        fields: {},
        kycServer: "",
        minAmount,
        maxAmount,
        status: ActionStatus.NEEDS_INPUT,
        token: "",
        transferServerUrl: tomlResponse.TRANSFER_SERVER,
        anchorQuoteServer,
        sellAsset,
        withdrawAssets,
      } as InitiateWithdrawActionPayload;

      if (isAuthenticationRequired) {
        // Re-check toml for auth endpoint
        const webAuthTomlResponse = await checkTomlForFields({
          sepName: "SEP-6 withdrawal",
          assetIssuer,
          requiredKeys: [
            TomlFields.WEB_AUTH_ENDPOINT,
            TomlFields.SIGNING_KEY,
            TomlFields.KYC_SERVER,
          ],
          networkUrl: networkConfig.url,
          homeDomain,
        });
        log.instruction({
          title:
            "SEP-6 withdrawal is enabled, and requires authentication so we should go through SEP-10",
        });

        // SEP-10 start
        const challengeTransaction = await sep10AuthStart({
          authEndpoint: webAuthTomlResponse.WEB_AUTH_ENDPOINT,
          serverSigningKey: webAuthTomlResponse.SIGNING_KEY,
          publicKey,
          homeDomain: normalizeHomeDomainUrl(homeDomain).host,
          clientDomain,
        });

        // SEP-10 sign
        const signedChallengeTransaction = await sep10AuthSign({
          secretKey,
          networkPassphrase: networkConfig.network,
          challengeTransaction,
          walletBackendEndpoint,
        });

        // SEP-10 send
        const token = await sep10AuthSend({
          authEndpoint: webAuthTomlResponse.WEB_AUTH_ENDPOINT,
          signedChallengeTransaction,
        });

        payload = {
          ...payload,
          kycServer: webAuthTomlResponse.KYC_SERVER,
          token,
        };
      }

      return payload;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-6 withdrawal failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Get price
export const sep6WithdrawPriceAction = createAsyncThunk<
  {
    status: ActionStatus;
    price: AnchorPriceItem;
  },
  {
    sellAsset: string;
    buyAsset: string;
    sellAmount: string;
    buyDeliveryMethod: string;
    countryCode?: string;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/sep6WithdrawPriceAction",
  async (
    { sellAsset, buyAsset, sellAmount, buyDeliveryMethod, countryCode },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data: sep6Data } = sep6WithdrawSelector(getState());

      const { anchorQuoteServer, token } = sep6Data;

      const price = await getPrice({
        anchorQuoteServerUrl: anchorQuoteServer,
        token,
        options: {
          context: "sep6",
          sell_asset: sellAsset,
          buy_asset: buyAsset,
          sell_amount: sellAmount,
          buy_delivery_method: buyDeliveryMethod,
          ...(countryCode ? { country_code: countryCode } : {}),
        },
      });

      return {
        status: ActionStatus.PRICE,
        price,
      };
    } catch (e) {
      const errorMessage = getErrorMessage(e);

      log.error({
        title: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Get quote
type WithdrawQuoteProps = {
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;
  buyDeliveryMethod: string;
  countryCode?: string;
};

export const getWithdrawQuoteAction = createAsyncThunk<
  AnchorQuote,
  WithdrawQuoteProps,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/getWithdrawQuoteAction",
  async (
    { sellAsset, buyAsset, sellAmount, buyDeliveryMethod, countryCode },
    { rejectWithValue, getState },
  ) => {
    const { data } = sep6WithdrawSelector(getState());

    log.instruction({ title: "Getting SEP-38 quote" });

    try {
      const quote = await postQuote(
        sanitizeObject({
          anchorQuoteServerUrl: data.anchorQuoteServer || "",
          token: data.token,
          sell_asset: sellAsset,
          buy_asset: buyAsset,
          sell_amount: sellAmount,
          buy_delivery_method: buyDeliveryMethod,
          country_code: countryCode,
          context: "sep6",
        }),
      );

      return quote;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-38 quote failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Submit transaction with SEP-38 quotes to start polling for the status
export const initSep6WithdrawFlowWithQuoteAction = createAsyncThunk<
  {
    status: ActionStatus;
    withdrawResponse: Sep6WithdrawResponse;
  },
  {
    amount: string;
    sourceAssetCode: string;
    destinationAsset: string;
    quoteId: string | undefined;
    withdrawType: AnyObject;
    infoFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/initSep6WithdrawFlowWithQuoteAction",
  async (
    {
      amount,
      sourceAssetCode,
      destinationAsset,
      quoteId,
      withdrawType,
      infoFields,
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";

      const { data: sep6Data } = sep6WithdrawSelector(getState());
      const { transferServerUrl, token } = sep6Data;

      const withdrawResponse = (await programmaticWithdrawExchangeFlow({
        amount,
        sourceAssetCode,
        destinationAsset,
        quoteId,
        publicKey,
        transferServerUrl,
        token,
        type: withdrawType.type,
        withdrawFields: infoFields,
        claimableBalanceSupported,
      })) as Sep6WithdrawResponse;

      return {
        status: ActionStatus.CAN_PROCEED,
        withdrawResponse,
      };
    } catch (e) {
      const errorMessage = getErrorMessage(e);

      log.error({
        title: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Submit transaction to start polling for the status
export const initSep6WithdrawFlow = createAsyncThunk<
  {
    status: ActionStatus;
    withdrawResponse: Sep6WithdrawResponse;
  },
  {
    withdrawType: AnyObject;
    infoFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/initSep6WithdrawFlow",
  async ({ withdrawType, infoFields }, { rejectWithValue, getState }) => {
    try {
      const { data } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";

      const { data: sep6Data } = sep6WithdrawSelector(getState());
      const { assetCode, transferServerUrl, token } = sep6Data;

      const withdrawResponse = (await programmaticWithdrawFlow({
        assetCode,
        publicKey,
        transferServerUrl,
        token,
        type: withdrawType.type,
        withdrawFields: infoFields,
        claimableBalanceSupported,
      })) as Sep6WithdrawResponse;

      return {
        status: ActionStatus.CAN_PROCEED,
        withdrawResponse,
      };
    } catch (e) {
      const errorMessage = getErrorMessage(e);

      log.error({
        title: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

export const submitSep6WithdrawAction = createAsyncThunk<
  {
    currentStatus: TransactionStatus;
    transactionResponse: AnyObject;
    status: ActionStatus;
    requiredCustomerInfoUpdates: string[] | undefined;
    customerFields?: { [key: string]: AnyObject };
  },
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/submitSep6WithdrawAction",
  async (amount, { rejectWithValue, getState }) => {
    try {
      const { secretKey, data } = accountSelector(getState());
      const networkConfig = getNetworkConfig();
      const { data: sep6Data } = sep6WithdrawSelector(getState());

      const {
        assetCode,
        assetIssuer,
        transferServerUrl,
        token,
        withdrawResponse,
        kycServer,
      } = sep6Data;

      // Poll transaction until complete
      const { currentStatus, transaction, requiredCustomerInfoUpdates } =
        await pollWithdrawUntilComplete({
          amount,
          secretKey,
          transactionId: withdrawResponse?.id || "",
          token,
          transferServerUrl,
          networkPassphrase: networkConfig.network,
          networkUrl: networkConfig.url,
          assetCode,
          assetIssuer,
        });

      let customerFields;

      // Need to get KYC fields to get field info
      if (currentStatus === TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE) {
        // Get SEP-12 fields
        log.instruction({
          title: "Making GET `/customer` request for user",
        });

        customerFields = (
          await collectSep12Fields({
            publicKey: data?.id!,
            token,
            kycServer,
            transactionId: withdrawResponse?.id,
          })
        ).fieldsToCollect;
      }

      return {
        currentStatus,
        transactionResponse: transaction,
        status:
          currentStatus === TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE
            ? ActionStatus.NEEDS_KYC
            : ActionStatus.SUCCESS,
        requiredCustomerInfoUpdates,
        customerFields,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-6 withdrawal failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

export const submitSep6WithdrawCustomerInfoFieldsAction = createAsyncThunk<
  { status: ActionStatus; customerFields?: AnyObject },
  AnyObject,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Withdraw/submitSep6WithdrawCustomerInfoFieldsAction",
  async (customerFields, { rejectWithValue, getState }) => {
    try {
      const { data: account, secretKey } = accountSelector(getState());
      const { data: sep6Data } = sep6WithdrawSelector(getState());
      const { kycServer, token } = sep6Data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          secretKey,
          token,
          transactionId: sep6Data.withdrawResponse?.id,
        });
      }

      // Get SEP-12 fields
      log.instruction({
        title: "Making GET `/customer` request for user",
      });

      const sep12Response = await collectSep12Fields({
        publicKey: account?.id!,
        token,
        kycServer,
        transactionId: sep6Data.withdrawResponse?.id,
      });

      if (sep12Response.status !== Sep12CustomerStatus.ACCEPTED) {
        return {
          status: ActionStatus.NEEDS_KYC,
          customerFields: sep12Response.fieldsToCollect,
        };
      }

      return {
        status: ActionStatus.KYC_DONE,
      };
    } catch (e) {
      const errorMessage = getErrorMessage(e);

      log.error({
        title: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

const initialState: Sep6WithdrawAssetInitialState = {
  data: {
    assetCode: "",
    assetIssuer: "",
    currentStatus: "" as TransactionStatus,
    withdrawTypes: {
      types: {},
    },
    fields: {},
    minAmount: 0,
    maxAmount: 0,
    kycServer: "",
    transferServerUrl: "",
    trustedAssetAdded: "",
    token: "",
    transactionResponse: {},
    withdrawResponse: { account_id: "" },
    requiredCustomerInfoUpdates: undefined,
    anchorQuoteServer: undefined,
  },
  status: undefined,
  errorString: undefined,
};

const sep6WithdrawSlice = createSlice({
  name: "sep6Withdraw",
  initialState,
  reducers: {
    resetSep6WithdrawAction: () => initialState,
    setStatusAction: (state, action) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initiateWithdrawAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initiateWithdrawAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status = action.payload.status;
    });
    builder.addCase(initiateWithdrawAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep6WithdrawPriceAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6WithdrawPriceAction.fulfilled, (state, action) => {
      state.data.price = action.payload.price;
      state.status = action.payload.status;
    });
    builder.addCase(sep6WithdrawPriceAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(getWithdrawQuoteAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(getWithdrawQuoteAction.fulfilled, (state, action) => {
      state.data.quote = action.payload;
      state.status = ActionStatus.ANCHOR_QUOTES;
    });
    builder.addCase(getWithdrawQuoteAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(initSep6WithdrawFlowWithQuoteAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(
      initSep6WithdrawFlowWithQuoteAction.fulfilled,
      (state, action) => {
        state.status = action.payload.status;
        state.data.withdrawResponse = action.payload.withdrawResponse;
      },
    );
    builder.addCase(
      initSep6WithdrawFlowWithQuoteAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );

    builder.addCase(initSep6WithdrawFlow.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initSep6WithdrawFlow.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.withdrawResponse = action.payload.withdrawResponse;
    });
    builder.addCase(initSep6WithdrawFlow.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(submitSep6WithdrawAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(submitSep6WithdrawAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.currentStatus = action.payload.currentStatus;
      state.data.transactionResponse = action.payload.transactionResponse;

      const customerFields = {
        ...action.payload.customerFields,
      };

      state.data.requiredCustomerInfoUpdates =
        action.payload.requiredCustomerInfoUpdates?.map((field) => ({
          ...customerFields[field],
          id: field,
        }));

      if (action.payload.customerFields) {
        state.data.fields = customerFields;
      }
    });
    builder.addCase(submitSep6WithdrawAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.NEEDS_INPUT;
    });

    builder.addCase(
      submitSep6WithdrawCustomerInfoFieldsAction.pending,
      (state) => {
        state.errorString = undefined;
        state.status = ActionStatus.PENDING;
      },
    );
    builder.addCase(
      submitSep6WithdrawCustomerInfoFieldsAction.fulfilled,
      (state, action) => {
        state.status = action.payload.status;
        state.data.fields = { ...action.payload.customerFields };
      },
    );
    builder.addCase(
      submitSep6WithdrawCustomerInfoFieldsAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sep6WithdrawSelector = (state: RootState) => state.sep6Withdraw;

export const { reducer } = sep6WithdrawSlice;
export const { resetSep6WithdrawAction, setStatusAction } =
  sep6WithdrawSlice.actions;
