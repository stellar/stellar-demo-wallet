import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { checkDepositWithdrawInfo } from "methods/checkDepositWithdrawInfo";
import { programmaticDepositFlow } from "methods/sep6";
import {
  sep10AuthStart,
  sep10AuthSign,
  sep10AuthSend,
} from "methods/sep10Auth";
import { collectSep12Fields, putSep12FieldsRequest } from "methods/sep12";
import { checkTomlForFields } from "methods/checkTomlForFields";
import {
  Asset,
  ActionStatus,
  Sep6DepositAssetInitialState,
  Sep6DepositResponse,
  RejectMessage,
  TomlFields,
  AnchorActionType,
  AnyObject,
} from "types/types.d";

export const initiateDepositAction = createAsyncThunk<
  { customerFields: AnyObject; infoFields: AnyObject; status: ActionStatus },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/initiateDepositAction",
  async (asset, { rejectWithValue, getState }) => {
    const { assetCode, assetIssuer, homeDomain } = asset;
    const { data, secretKey } = accountSelector(getState());
    const { pubnet } = settingsSelector(getState());
    const networkConfig = getNetworkConfig(pubnet);
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
      } = assetInfoData;

      let payload = {
        assetCode,
        infoFields: { ...assetInfoData.fields },
        customerFields: {},
        kycServer: "",
        status: ActionStatus.NEEDS_INPUT,
        token: "",
        transferServer: tomlResponse.TRANSFER_SERVER,
      };

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
          homeDomain,
        });

        // SEP-10 sign
        const signedChallengeTransaction = sep10AuthSign({
          secretKey,
          networkPassphrase: networkConfig.network,
          challengeTransaction,
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
  { status: ActionStatus; type: string; depositFields: AnyObject },
  {
    depositType: AnyObject;
    infoFields: AnyObject;
    customerFields: AnyObject;
  },
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/submitSep6DepositFields",
  async (
    { depositType, customerFields, infoFields },
    { rejectWithValue, getState },
  ) => {
    try {
      const { secretKey } = accountSelector(getState());
      const { data } = sep6DepositSelector(getState());
      const { kycServer, token } = data;

      if (Object.keys(customerFields).length) {
        await putSep12FieldsRequest({
          fields: customerFields,
          kycServer,
          secretKey,
          token,
        });
      }
      return {
        status: ActionStatus.CAN_PROCEED,
        type: depositType.type,
        depositFields: infoFields,
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
  { depositResponse: Sep6DepositResponse; status: ActionStatus },
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6DepositAsset/sep6DepositAction",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { data } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";
      const { data: sep6data } = sep6DepositSelector(getState());

      const {
        assetCode,
        depositFields,
        transferServer,
        token,
        type,
      } = sep6data;

      const depositResponse = (await programmaticDepositFlow({
        assetCode,
        publicKey,
        transferServerUrl: transferServer,
        token,
        type,
        depositFields,
        claimableBalanceSupported,
      })) as Sep6DepositResponse;

      return { depositResponse, status: ActionStatus.SUCCESS };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-8 deposit failed",
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
    depositFields: {},
    depositResponse: { how: "" },
    infoFields: {
      type: {
        choices: [],
      },
    },
    customerFields: {},
    kycServer: "",
    transferServer: "",
    token: "",
    type: "",
  },
  status: undefined,
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
      state.data.type = action.payload.type;
      state.data.depositFields = action.payload.depositFields;
    });
    builder.addCase(submitSep6DepositFields.rejected, (state, action) => {
      state.errorString = action.payload?.errorString;
      state.status = ActionStatus.ERROR;
    });
    builder.addCase(sep6DepositAction.pending, (state) => {
      state.errorString = undefined;
      state.status = ActionStatus.PENDING;
    });
    builder.addCase(sep6DepositAction.fulfilled, (state, action) => {
      state.status = action.payload.status;
      state.data.depositResponse = action.payload.depositResponse;
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
