import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "config/store";
import { accountSelector } from "ducks/account";
import { settingsSelector } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { checkDepositWithdrawInfo } from "methods/checkDepositWithdrawInfo";
import { programmaticWithdrawFlow } from "methods/sep6";
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
  Sep6WithdrawAssetInitialState,
  Sep6WithdrawResponse,
  RejectMessage,
  TomlFields,
  AnchorActionType,
  AnyObject,
} from "types/types.d";

export const initiateWithdrawAction = createAsyncThunk<
  { fields: AnyObject; status: ActionStatus },
  Asset,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6WithdrawAsset/initiateWithdrawAction",
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

      const {
        authentication_required: isAuthenticationRequired,
      } = assetInfoData;

      let payload = {
        assetCode,
        withdrawTypes: { types: { ...assetInfoData.types } },
        fields: {},
        kycServer: "",
        status: ActionStatus.NEEDS_INPUT,
        token: "",
        transferServer: tomlResponse.TRANSFER_SERVER,
      };

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
  { status: ActionStatus; type: string; withdrawFields: AnyObject },
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
      const { secretKey } = accountSelector(getState());
      const { data } = sepWithdrawSelector(getState());
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
        type: withdrawType.type,
        withdrawFields: infoFields,
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
  { withdrawResponse: Sep6WithdrawResponse; status: ActionStatus },
  undefined,
  { rejectValue: RejectMessage; state: RootState }
>(
  "sep6WithdrawAsset/sep6WithdrawAction",
  async (_, { rejectWithValue, getState }) => {
    try {
      const { data } = accountSelector(getState());
      const { claimableBalanceSupported } = settingsSelector(getState());
      const publicKey = data?.id || "";
      const { data: sep6Data } = sepWithdrawSelector(getState());

      const {
        assetCode,
        transferServer,
        token,
        type,
        withdrawFields,
      } = sep6Data;

      const withdrawResponse = (await programmaticWithdrawFlow({
        assetCode,
        publicKey,
        transferServerUrl: transferServer,
        token,
        type,
        withdrawFields,
        claimableBalanceSupported,
      })) as Sep6WithdrawResponse;

      return { withdrawResponse, status: ActionStatus.SUCCESS };
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      log.error({
        title: "SEP-8 withdrawal failed",
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
    withdrawTypes: {
      types: {},
    },
    fields: {},
    kycServer: "",
    transferServer: "",
    token: "",
    type: "",

    withdrawFields: {},
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
      state.data.type = action.payload.type;
      state.data.withdrawFields = action.payload.withdrawFields;
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
      state.data.withdrawResponse = action.payload.withdrawResponse;
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
