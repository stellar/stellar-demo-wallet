import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { normalizeHomeDomainUrl } from "demo-wallet-shared/build/helpers/normalizeHomeDomainUrl";
import { log } from "demo-wallet-shared/build/helpers/log";
import { checkDepositWithdrawInfo } from "demo-wallet-shared/build/methods/checkDepositWithdrawInfo";
import {
  pollDepositUntilComplete,
  programmaticDepositExchangeFlow,
  programmaticDepositFlow,
} from "demo-wallet-shared/build/methods/sep6";
import {
  sep10AuthStart,
  sep10AuthSign,
  sep10AuthSend,
} from "demo-wallet-shared/build/methods/sep10Auth";
import {
  collectSep12Fields,
  putSep12FieldsRequest,
} from "demo-wallet-shared/build/methods/sep12";
import { checkTomlForFields } from "demo-wallet-shared/build/methods/checkTomlForFields";
import { trustAsset } from "demo-wallet-shared/build/methods/trustAsset";
import {
  Asset,
  ActionStatus,
  Sep6DepositAssetInitialState,
  Sep6DepositResponse,
  RejectMessage,
  TomlFields,
  AnchorActionType,
  AnyObject,
  TransactionStatus,
  SepInstructions,
  Sep12CustomerStatus,
} from "types/types";

type InitiateDepositActionPayload = Sep6DepositAssetInitialState["data"] & {
  status: ActionStatus;
};

export const initiateDepositAction = createAsyncThunk<
  InitiateDepositActionPayload,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/initiateDepositAction",
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

      let anchorQuoteServer;

      // Check SEP-38 quote server key in toml, if supported
      if (infoData["deposit-exchange"]) {
        const tomlSep38Response = await checkTomlForFields({
          sepName: "SEP-38 Anchor RFQ",
          assetIssuer,
          requiredKeys: [TomlFields.ANCHOR_QUOTE_SERVER],
          networkUrl: networkConfig.url,
          homeDomain,
        });

        anchorQuoteServer = tomlSep38Response.ANCHOR_QUOTE_SERVER;
      }

      const assetInfoData = infoData[AnchorActionType.DEPOSIT][assetCode];

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
      } as InitiateDepositActionPayload;

      if (isAuthenticationRequired) {
        // Re-check toml for auth endpoint
        const webAuthTomlResponse = await checkTomlForFields({
          sepName: "SEP-6 deposit",
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
            "SEP-6 deposit is enabled, and requires authentication so we should go through SEP-10",
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
        title: "SEP-6 deposit failed",
        body: errorMessage,
      });

      return rejectWithValue({
        errorString: errorMessage,
      });
    }
  },
);

// Submit transaction to start polling for the status
export const submitSep6DepositFields = createAsyncThunk<
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
  "sep6DepositAsset/submitSep6DepositFields",
  async (
    { amount, depositType, infoFields },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data } = accountSelector(getState());
      const publicKey = data?.id || "";
      const { claimableBalanceSupported } = settingsSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { assetCode, transferServerUrl, token } = sep6Data;

      const depositResponse = (await programmaticDepositFlow({
        amount,
        assetCode,
        publicKey,
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

// Submit transaction with SEP-38 quotes to start polling for the status
export const submitSep6DepositWithQuotesFields = createAsyncThunk<
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
  "sep6DepositAsset/submitSep6DepositWithQuotesFields",
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
      const { data } = accountSelector(getState());
      const publicKey = data?.id || "";
      const { claimableBalanceSupported } = settingsSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { transferServerUrl, token } = sep6Data;

      const depositResponse = (await programmaticDepositExchangeFlow({
        amount,
        sourceAsset,
        destinationAssetCode,
        quoteId,
        publicKey,
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

export const submitSep6CustomerInfoFields = createAsyncThunk<
  { status: ActionStatus; customerFields?: AnyObject },
  AnyObject,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/submitSep6CustomerInfoFields",
  async (customerFields, { rejectWithValue, getState }) => {
    try {
      const { data: account, secretKey } = accountSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { kycServer, token } = sep6Data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          secretKey,
          token,
          transactionId: sep6Data.depositResponse?.id,
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

export const sep6DepositAction = createAsyncThunk<
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
  "sep6DepositAsset/sep6DepositAction",
  async (_, { rejectWithValue, getState, dispatch }) => {
    try {
      const { secretKey, data } = accountSelector(getState());
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

      const trustAssetCallback = async () => {
        const assetString = `${assetCode}:${assetIssuer}`;

        await trustAsset({
          secretKey,
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
            publicKey: data?.id!,
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

const sep6DepositAssetSlice = createSlice({
  name: "sep6DepositAsset",
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

    builder.addCase(submitSep6DepositFields.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(submitSep6DepositFields.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.depositResponse = action.payload.depositResponse;
    });
    builder.addCase(submitSep6DepositFields.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(submitSep6DepositWithQuotesFields.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(
      submitSep6DepositWithQuotesFields.fulfilled,
      (state, action) => {
        state.status = action.payload.status;
        state.data.depositResponse = action.payload.depositResponse;
      },
    );
    builder.addCase(
      submitSep6DepositWithQuotesFields.rejected,
      (state, action) => {
        state.errorString = action.payload?.errorString;
        state.status = ActionStatus.ERROR;
      },
    );

    builder.addCase(submitSep6CustomerInfoFields.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(submitSep6CustomerInfoFields.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.customerFields = { ...action.payload.customerFields };
    });
    builder.addCase(submitSep6CustomerInfoFields.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });

    builder.addCase(sep6DepositAction.pending, (state) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6DepositAction.fulfilled, (state, action) => {
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
    builder.addCase(sep6DepositAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sep6DepositSelector = (state: RootState) => state.sep6DepositAsset;

export const { reducer } = sep6DepositAssetSlice;
export const {
  resetSep6DepositAction,
  updateInstructionsAction,
  setStatusAction,
} = sep6DepositAssetSlice.actions;
