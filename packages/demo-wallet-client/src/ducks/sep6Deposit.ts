import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { checkDepositWithdrawInfo } from "demo-wallet-shared/build/methods/checkDepositWithdrawInfo";
import { checkTomlForFields, getFromToml } from "demo-wallet-shared/build/methods/checkTomlForFields";
import {
  getInfo,
  getPrice,
  postQuote,
} from "demo-wallet-shared/build/methods/sep38Quotes";
import {
  pollDepositUntilComplete,
  programmaticDepositExchangeFlow,
  programmaticDepositFlow,
} from "demo-wallet-shared/build/methods/sep6";
import { trustAsset } from "demo-wallet-shared/build/methods/trustAsset";
import {
  collectSep12Fields,
  putSep12FieldsRequest,
} from "demo-wallet-shared/build/methods/sep12";

import { clientDomain, RootState, walletBackendEndpoint } from "config/store";
import { sanitizeObject } from "helpers/sanitizeObject";
import { settingsSelector } from "ducks/settings";

import {
  ActionStatus,
  AnchorActionType,
  AnchorQuote,
  AnyObject,
  Asset,
  RejectMessage,
  Sep12CustomerStatus,
  Sep6DepositAssetInitialState,
  Sep6DepositResponse,
  SepInstructions,
  TomlFields,
  TransactionStatus,
} from "types/types";
import { AnchorPriceItem } from "demo-wallet-shared/build/types/types";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";
import { getUnifiedAccountData } from "../helpers/accountUtils";
import { authenticateWithSep10, authenticateWithSep45 } from "./authUtils";

type InitiateDepositActionPayload = Sep6DepositAssetInitialState["data"] & {
  status: ActionStatus;
};

export const initiateDepositAction = createAsyncThunk<
  InitiateDepositActionPayload,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/initiateDepositAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;
    // This is unlikely
    if (!homeDomain) {
      throw new Error("Something went wrong, home domain is not defined.");
    }

    const networkConfig = getNetworkConfig();
    const kycServerUrl = await getFromToml({
      assetIssuer,
      homeDomain,
      networkUrl: networkConfig.url,
      requiredKey: TomlFields.KYC_SERVER,
    });

    const unifiedAccount = getUnifiedAccountData(getState());
    if (!unifiedAccount) {
      throw new Error("No valid account found.");
    }

    log.instruction({ title: "Initiating a SEP-6 deposit" });

    try {
      // Check toml
      const tomlResponse = await checkTomlForFields({
        sepName: "SEP-6 deposit",
        assetIssuer,
        requiredKeys: [TomlFields.TRANSFER_SERVER],
        networkUrl: networkConfig.url,
        homeDomain,
      });

      // Check info
      const infoData = await checkDepositWithdrawInfo({
        type: AnchorActionType.DEPOSIT,
        transferServerUrl: tomlResponse.TRANSFER_SERVER,
        assetCode,
      });

      const buyAsset = isNativeAsset(assetCode)
        ? "stellar:native"
        : `stellar:${assetCode}:${assetIssuer}`;

      let anchorQuoteServer;
      let depositAssets;

      const supportsQuotes = Boolean(infoData["deposit-exchange"]);

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

        depositAssets = quotesResult.assets.filter(
          (a) => a.asset !== buyAsset && a.sell_delivery_methods,
        );

        log.instruction({
          title: "Supported SEP-38 assets for deposit",
          body: depositAssets,
        });
      }

      const actionType =
        supportsQuotes && depositAssets && depositAssets?.length > 0
          ? AnchorActionType.DEPOSIT_EXCHANGE
          : AnchorActionType.DEPOSIT;

      log.instruction({
        title: `Selected ${actionType} path`,
      });

      // Get either deposit or deposit-exchange asset data
      const assetInfoData =
        infoData[
          supportsQuotes && depositAssets && depositAssets?.length > 0
            ? AnchorActionType.DEPOSIT_EXCHANGE
            : AnchorActionType.DEPOSIT
        ]?.[isNativeAsset(assetCode) ? "native" : assetCode];

      // This is unlikely
      if (!assetInfoData) {
        throw new Error(
          `Something went wrong, deposit asset ${assetCode} is not configured.`,
        );
      }

      const {
        authentication_required: isAuthenticationRequired,
        min_amount: minAmount = 0,
        max_amount: maxAmount = 0,
      } = assetInfoData;

      let payload = {
        assetCode,
        assetIssuer,
        infoFields: { ...assetInfoData.fields },
        minAmount,
        maxAmount,
        customerFields: {},
        kycServer: "",
        status: ActionStatus.NEEDS_INPUT,
        token: "",
        transferServerUrl: tomlResponse.TRANSFER_SERVER,
        anchorQuoteServer,
        buyAsset,
        depositAssets,
      } as InitiateDepositActionPayload;

      if (isAuthenticationRequired) {
        if (unifiedAccount.accountType === 'classic') {
          // Regular account - use SEP-10 authentication
          const { publicKey, secretKey } = unifiedAccount;
          if (!publicKey || !secretKey) {
            throw new Error("Public key and secret key are required for SEP-6 deposit.");
          }

          log.instruction({
            title:
              "SEP-6 deposit is enabled, and requires authentication so we should go through SEP-10",
          });
          const token = await authenticateWithSep10(
            actionType,
            assetCode,
            assetIssuer,
            clientDomain,
            homeDomain,
            publicKey,
            [
              TomlFields.WEB_AUTH_ENDPOINT,
              TomlFields.SIGNING_KEY,
              TomlFields.TRANSFER_SERVER,
              TomlFields.KYC_SERVER,
            ],
            secretKey,
            "SEP-6 deposit",
            getState(),
            walletBackendEndpoint,
          )

          payload = {
            ...payload,
            kycServer: kycServerUrl,
            token,
          };
        } else {
          // Contract account - use contract authentication
          const { contractId } = unifiedAccount;
          if (!contractId) {
            throw new Error("Contract ID is required for SEP-6 deposit.");
          }
          // SEP-45 start
          const token = await authenticateWithSep45(
            actionType,
            assetCode,
            assetIssuer,
            contractId,
            clientDomain,
            homeDomain,
            [
              TomlFields.WEB_AUTH_CONTRACT_ID,
              TomlFields.WEB_AUTH_FOR_CONTRACTS_ENDPOINT,
              TomlFields.SIGNING_KEY,
              TomlFields.TRANSFER_SERVER,
              TomlFields.KYC_SERVER,
            ],
            "SEP-6 deposit",
            walletBackendEndpoint,
          )

          payload = {
            ...payload,
            kycServer: kycServerUrl,
            token,
          };
        }
      }

      return payload;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-6 deposit failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Get price
export const sep6DepositPriceAction = createAsyncThunk<
  {
    status: ActionStatus;
    price: AnchorPriceItem;
  },
  {
    sellAsset: string;
    buyAsset: string;
    sellAmount: string;
    sellDeliveryMethod: string;
    countryCode?: string;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/sep6DepositPriceAction",
  async (
    { sellAsset, buyAsset, sellAmount, sellDeliveryMethod, countryCode },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { anchorQuoteServer, token } = sep6Data;

      const price = await getPrice({
        anchorQuoteServerUrl: anchorQuoteServer,
        token,
        options: {
          context: "sep6",
          sell_asset: sellAsset,
          buy_asset: buyAsset,
          sell_amount: sellAmount,
          sell_delivery_method: sellDeliveryMethod,
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

type DepositQuoteProps = {
  sellAsset: string;
  buyAsset: string;
  sellAmount: string;
  sellDeliveryMethod: string;
  countryCode?: string;
};

export const getDepositQuoteAction = createAsyncThunk<
  AnchorQuote,
  DepositQuoteProps,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/getDepositQuoteAction",
  async (
    { sellAsset, buyAsset, sellAmount, sellDeliveryMethod, countryCode },
    { rejectWithValue, getState },
  ) => {
    const { data } = sep6DepositSelector(getState());

    log.instruction({ title: "Getting SEP-38 quote" });

    try {
      const quote = await postQuote(
        sanitizeObject({
          anchorQuoteServerUrl: data.anchorQuoteServer || "",
          token: data.token,
          sell_asset: sellAsset,
          buy_asset: buyAsset,
          sell_amount: sellAmount,
          sell_delivery_method: sellDeliveryMethod,
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
export const initSep6DepositFlowWithQuoteAction = createAsyncThunk<
  {
    status: ActionStatus;
    depositResponse: Sep6DepositResponse;
  },
  {
    amount: string;
    quoteId: string;
    destinationAssetCode: string;
    sourceAsset: string;
    depositType: AnyObject;
    infoFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/initSep6DepositFlowWithQuoteAction",
  async (
    {
      amount,
      quoteId,
      destinationAssetCode,
      sourceAsset,
      depositType,
      infoFields,
    },
    { rejectWithValue, getState },
  ) => {
    try {
      const unifiedAccount = getUnifiedAccountData(getState());
      if (!unifiedAccount) {
        throw new Error("No valid account found");
      }
      const account = unifiedAccount.identifier;
      const { claimableBalanceSupported } = settingsSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { transferServerUrl, token } = sep6Data;

      const depositResponse = (await programmaticDepositExchangeFlow({
        amount,
        sourceAsset,
        destinationAssetCode,
        quoteId,
        account,
        transferServerUrl,
        token,
        type: depositType.type,
        depositFields: infoFields,
        claimableBalanceSupported,
      })) as Sep6DepositResponse;

      return {
        status: ActionStatus.CAN_PROCEED,
        depositResponse,
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
export const initSep6DepositFlowAction = createAsyncThunk<
  {
    status: ActionStatus;
    depositResponse: Sep6DepositResponse;
  },
  {
    amount?: string;
    depositType: AnyObject;
    infoFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/initSep6DepositFlowAction",
  async (
    { amount, depositType, infoFields },
    { rejectWithValue, getState },
  ) => {
    try {
      const unifiedAccount = getUnifiedAccountData(getState());
      if (!unifiedAccount) {
        throw new Error("No valid account found");
      }
      const account = unifiedAccount.identifier;
      const { claimableBalanceSupported } = settingsSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { assetCode, transferServerUrl, token } = sep6Data;

      const depositResponse = (await programmaticDepositFlow({
        amount,
        assetCode,
        account,
        transferServerUrl,
        token,
        type: depositType.type,
        depositFields: infoFields,
        claimableBalanceSupported,
      })) as Sep6DepositResponse;

      return {
        status: ActionStatus.CAN_PROCEED,
        depositResponse,
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

export const submitSep6DepositAction = createAsyncThunk<
  {
    currentStatus: string;
    status: ActionStatus;
    trustedAssetAdded: string;
    requiredCustomerInfoUpdates: string[] | undefined;
    customerFields?: { [key: string]: AnyObject };
  },
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/submitSep6DepositAction",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const unifiedAccount = getUnifiedAccountData(getState());
      if (!unifiedAccount) {
        throw new Error("No valid account found");
      }
      const networkConfig = getNetworkConfig();
      const { data: sep6Data } = sep6DepositSelector(getState());

      const {
        assetCode,
        assetIssuer,
        depositResponse,
        transferServerUrl,
        token,
        kycServer,
      } = sep6Data;

      let trustAssetCallback;
      if (unifiedAccount.accountType === 'contract') {
        trustAssetCallback = async () => {
          const assetString = `${assetCode}:${assetIssuer}`;

          await trustAsset({
            secretKey: unifiedAccount.secretKey!,
            networkPassphrase: networkConfig.network,
            networkUrl: networkConfig.url,
            untrustedAsset: {
              assetString,
              assetCode,
              assetIssuer,
            },
          });

          return assetString;
        };
      }

      // Poll transaction until complete
      const {
        currentStatus = "",
        trustedAssetAdded = "",
        requiredCustomerInfoUpdates,
      } = await pollDepositUntilComplete({
        transactionId: depositResponse?.id || "",
        token,
        transferServerUrl,
        trustAssetCallback,
        dispatchInstructions: (instructions: SepInstructions) =>
          dispatch(updateInstructionsAction(instructions)),
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
            account: unifiedAccount.identifier,
            token,
            kycServer,
            transactionId: depositResponse?.id,
          })
        ).fieldsToCollect;
      }

      return {
        currentStatus,
        status:
          currentStatus === TransactionStatus.PENDING_CUSTOMER_INFO_UPDATE
            ? ActionStatus.NEEDS_KYC
            : ActionStatus.SUCCESS,
        trustedAssetAdded,
        requiredCustomerInfoUpdates,
        customerFields,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-6 deposit failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

export const submitSep6CustomerInfoFieldsAction = createAsyncThunk<
  { status: ActionStatus; customerFields?: AnyObject },
  AnyObject,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6Deposit/submitSep6CustomerInfoFieldsAction",
  async (customerFields, { rejectWithValue, getState }) => {
    try {
      // ✅ With this:
      const unifiedAccount = getUnifiedAccountData(getState());
      if (!unifiedAccount) {
        throw new Error("No valid account found");
      }

      const { data: sep6Data } = sep6DepositSelector(getState());

      const { kycServer, token } = sep6Data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          account: unifiedAccount.identifier,
          token,
          transactionId: sep6Data.depositResponse?.id,
        });
      }

      // Get SEP-12 fields
      log.instruction({
        title: "Making GET `/customer` request for user",
      });

      const sep12Response = await collectSep12Fields({
        account: unifiedAccount.identifier,
        token,
        kycServer,
        transactionId: sep6Data.depositResponse?.id,
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

const initialState: Sep6DepositAssetInitialState = {
  data: {
    assetCode: "",
    assetIssuer: "",
    currentStatus: "",
    customerFields: {},
    depositResponse: { how: "" },
    infoFields: {
      type: {
        choices: [],
      },
    },
    minAmount: 0,
    maxAmount: 0,
    kycServer: "",
    token: "",
    transferServerUrl: "",
    trustedAssetAdded: "",
    requiredCustomerInfoUpdates: undefined,
    instructions: undefined,
    anchorQuoteServer: undefined,
  },
  status: "" as ActionStatus,
  errorString: undefined,
};

const sep6DepositSlice = createSlice({
  name: "sep6Deposit",
  initialState,
  reducers: {
    resetSep6DepositAction: () => initialState,
    updateInstructionsAction: (state, action) => {
      state.data.instructions = action.payload;
    },
    setStatusAction: (state, action) => {
      state.status = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initiateDepositAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initiateDepositAction.fulfilled, (state, action) => {
      state.data = { ...state.data, ...action.payload };
      state.status = action.payload.status;
    });
    builder.addCase(initiateDepositAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep6DepositPriceAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6DepositPriceAction.fulfilled, (state, action) => {
      state.data.price = action.payload.price;
      state.status = action.payload.status;
    });
    builder.addCase(sep6DepositPriceAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(getDepositQuoteAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(getDepositQuoteAction.fulfilled, (state, action) => {
      state.data.quote = action.payload;
      state.status = ActionStatus.ANCHOR_QUOTES;
    });
    builder.addCase(getDepositQuoteAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(initSep6DepositFlowWithQuoteAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(
      initSep6DepositFlowWithQuoteAction.fulfilled,
      (state, action) => {
        state.status = action.payload.status;
        state.data.depositResponse = action.payload.depositResponse;
      },
    );
    builder.addCase(
      initSep6DepositFlowWithQuoteAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );

    builder.addCase(initSep6DepositFlowAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(initSep6DepositFlowAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.depositResponse = action.payload.depositResponse;
    });
    builder.addCase(initSep6DepositFlowAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(submitSep6DepositAction.pending, (state) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(submitSep6DepositAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.currentStatus = action.payload.currentStatus;
      state.data.trustedAssetAdded = action.payload.trustedAssetAdded;

      const customerFields = {
        ...action.payload.customerFields,
      };

      state.data.requiredCustomerInfoUpdates =
        action.payload.requiredCustomerInfoUpdates?.map((field) => ({
          ...customerFields[field],
          id: field,
        }));

      if (action.payload.customerFields) {
        state.data.customerFields = customerFields;
      }
    });
    builder.addCase(submitSep6DepositAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(submitSep6CustomerInfoFieldsAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(
      submitSep6CustomerInfoFieldsAction.fulfilled,
      (state, action) => {
        state.status = action.payload.status;
        state.data.customerFields = { ...action.payload.customerFields };
      },
    );
    builder.addCase(
      submitSep6CustomerInfoFieldsAction.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );
  },
});

export const sep6DepositSelector = (state: RootState) => state.sep6Deposit;

export const { reducer } = sep6DepositSlice;
export const {
  resetSep6DepositAction,
  updateInstructionsAction,
  setStatusAction,
} = sep6DepositSlice.actions;
