import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { checkDepositWithdrawInfo } from "demo-wallet-shared/build/methods/checkDepositWithdrawInfo";
import {
  pollDepositUntilComplete,
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

        const serviceDomain = new URL(tomlResponse.TRANSFER_SERVER).host;

        // SEP-10 start
        const challengeTransaction = await sep10AuthStart({
          authEndpoint: webAuthTomlResponse.WEB_AUTH_ENDPOINT,
          serverSigningKey: webAuthTomlResponse.SIGNING_KEY,
          publicKey,
          homeDomain: serviceDomain,
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

        // Get SEP-12 fields
        log.instruction({
          title: "Making GET `/customer` request for user",
        });

        const sep12Fields = await collectSep12Fields({
          publicKey,
          token,
          kycServer: webAuthTomlResponse.KYC_SERVER,
        });

        payload = {
          ...payload,
          kycServer: webAuthTomlResponse.KYC_SERVER,
          token,
        };

        if (sep12Fields) {
          payload = {
            ...payload,
            customerFields: { ...payload.customerFields, ...sep12Fields },
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

export const submitSep6DepositFields = createAsyncThunk<
  { status: ActionStatus; depositResponse: Sep6DepositResponse },
  {
    amount?: string;
    depositType: AnyObject;
    infoFields: AnyObject;
    customerFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/submitSep6DepositFields",
  async (
    { amount, depositType, customerFields, infoFields },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";
      const { secretKey } = accountSelector(getState());
      const { data: sep6Data } = sep6DepositSelector(getState());

      const { assetCode, kycServer, transferServerUrl, token } = sep6Data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          secretKey,
          token,
        });
      }

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

export const sep6DepositAction = createAsyncThunk<
  {
    currentStatus: string;
    status: ActionStatus;
    trustedAssetAdded: string;
  },
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/sep6DepositAction",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { secretKey } = accountSelector(getState());
      const networkConfig = getNetworkConfig();
      const { data: sep6Data } = sep6DepositSelector(getState());

      const {
        assetCode,
        assetIssuer,
        depositResponse,
        transferServerUrl,
        token,
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
      const { currentStatus = "", trustedAssetAdded = "" } =
        await pollDepositUntilComplete({
          transactionId: depositResponse.id || "",
          token,
          transferServerUrl,
          trustAssetCallback,
        });

      return {
        currentStatus,
        status: ActionStatus.SUCCESS,
        trustedAssetAdded,
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
  },
  status: "" as ActionStatus,
  errorString: undefined,
};

const sep6DepositAssetSlice = createSlice({
  name: "sep6DepositAsset",
  initialState,
  reducers: {
    resetSep6DepositAction: () => initialState,
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
    builder.addCase(sep6DepositAction.pending, (state) => {
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6DepositAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.currentStatus = action.payload.currentStatus;
      state.data.trustedAssetAdded = action.payload.trustedAssetAdded;
    });
    builder.addCase(sep6DepositAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
  },
});

export const sep6DepositSelector = (state: RootState) => state.sep6DepositAsset;

export const { reducer } = sep6DepositAssetSlice;
export const { resetSep6DepositAction } = sep6DepositAssetSlice.actions;
