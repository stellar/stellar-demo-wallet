import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, walletBackendEndpoint, clientDomain } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { checkDepositWithdrawInfo } from "demo-wallet-shared/build/methods/checkDepositWithdrawInfo";
import {
  pollWithdrawUntilComplete,
  programmaticWithdrawFlow,
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
import {
  Asset,
  ActionStatus,
  Sep6WithdrawAssetInitialState,
  Sep6WithdrawResponse,
  RejectMessage,
  TomlFields,
  AnchorActionType,
  AnyObject,
  TransactionStatus,
} from "types/types.d";

type InitiateWithdrawActionPayload = Sep6WithdrawAssetInitialState["data"] & {
  status: ActionStatus;
};

export const initiateWithdrawAction = createAsyncThunk<
  InitiateWithdrawActionPayload,
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6WithdrawAsset/initiateWithdrawAction",
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

      const assetInfoData = infoData[AnchorActionType.WITHDRAWAL][assetCode];

      const { authentication_required: isAuthenticationRequired } =
        assetInfoData;

      let payload = {
        assetCode,
        assetIssuer,
        withdrawTypes: { types: { ...assetInfoData.types } },
        fields: {},
        kycServer: "",
        status: ActionStatus.NEEDS_INPUT,
        token: "",
        transferServerUrl: tomlResponse.TRANSFER_SERVER,
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
          homeDomain,
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
            fields: { ...payload.fields, ...sep12Fields },
          };
        }
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

export const submitSep6WithdrawFields = createAsyncThunk<
  { status: ActionStatus; withdrawResponse: Sep6WithdrawResponse },
  {
    withdrawType: AnyObject;
    infoFields: AnyObject;
    customerFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6WithdrawAsset/submitSep6WithdrawFields",
  async (
    { withdrawType, infoFields, customerFields },
    { rejectWithValue, getState },
  ) => {
    try {
      const { data, secretKey } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";

      const { data: sep6Data } = sepWithdrawSelector(getState());
      const { assetCode, kycServer, transferServerUrl, token } = sep6Data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          secretKey,
          token,
        });
      }

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

export const sep6WithdrawAction = createAsyncThunk<
  {
    currentStatus: TransactionStatus;
    transactionResponse: AnyObject;
    status: ActionStatus;
  },
  string,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6WithdrawAsset/sep6WithdrawAction",
  async (amount, { rejectWithValue, getState }) => {
    try {
      const { secretKey } = accountSelector(getState());
      const networkConfig = getNetworkConfig();
      const { data: sep6Data } = sepWithdrawSelector(getState());

      const {
        assetCode,
        assetIssuer,
        transferServerUrl,
        token,
        withdrawResponse,
      } = sep6Data;

      // Poll transaction until complete
      const { currentStatus, transaction } = await pollWithdrawUntilComplete({
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

      return {
        currentStatus,
        transactionResponse: transaction,
        status: ActionStatus.SUCCESS,
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

const initialState: Sep6WithdrawAssetInitialState = {
  data: {
    assetCode: "",
    assetIssuer: "",
    currentStatus: "" as TransactionStatus,
    withdrawTypes: {
      types: {},
    },
    fields: {},
    kycServer: "",
    transferServerUrl: "",
    trustedAssetAdded: "",
    token: "",
    transactionResponse: {},
    withdrawResponse: { account_id: "" },
  },
  status: undefined,
  errorString: undefined,
};

const sep6WithdrawAssetSlice = createSlice({
  name: "sep6WithdrawAsset",
  initialState,
  reducers: {
    resetSep6WithdrawAction: () => initialState,
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
    builder.addCase(submitSep6WithdrawFields.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(submitSep6WithdrawFields.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.withdrawResponse = action.payload.withdrawResponse;
    });
    builder.addCase(submitSep6WithdrawFields.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
    builder.addCase(sep6WithdrawAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6WithdrawAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.currentStatus = action.payload.currentStatus;
      state.data.transactionResponse = action.payload.transactionResponse;
    });
    builder.addCase(sep6WithdrawAction.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.NEEDS_INPUT;
    });
  },
});

export const sepWithdrawSelector = (state: RootState) =>
  state.sep6WithdrawAsset;

export const { reducer } = sep6WithdrawAssetSlice;
export const { resetSep6WithdrawAction } = sep6WithdrawAssetSlice.actions;
