import { ReactNode } from "react";
import { Types } from "@stellar/wallet-sdk";
import { Horizon, ServerApi } from "stellar-sdk";

export interface Asset {
  assetString: string;
  assetCode: string;
  assetIssuer: string;
  assetType: string;
  total: string;
  homeDomain?: string;
  supportedActions?: AssetSupportedActions;
  isUntrusted?: boolean;
  source: any;
}

export interface AssetSupportedActions {
  sep6?: boolean;
  sep24?: boolean;
  sep31?: boolean;
}

export interface AccountInitialState {
  data: Types.AccountDetails | null;
  assets: {
    [key: string]: Asset;
  };
  errorString?: string;
  isAuthenticated: boolean;
  isUnfunded: boolean;
  secretKey: string;
  status: ActionStatus | undefined;
}

export interface ActiveAssetInitialState {
  asset: ActiveAsset | undefined;
  status: ActionStatus | undefined;
}

export interface ClaimAssetInitialState {
  data: {
    result: any;
    trustedAssetAdded?: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface ClaimableBalancesInitialState {
  data: {
    records: CleanedClaimableBalanceRecord[] | null;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface Sep24DepositAssetInitialState {
  data: {
    currentStatus: string;
    trustedAssetAdded?: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface LogsInitialState {
  items: LogItemProps[];
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface SendPaymentInitialState {
  data: Horizon.TransactionResponse | null;
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface SettingsInitialState {
  pubnet: boolean;
  secretKey: string;
  untrustedAssets: string;
  homeDomain: string;
  horizonURL: string;
}

export interface UntrustedAssetsInitialState {
  data: Asset[];
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface AnyObject {
  [key: string]: any;
}

export interface Sep31SendInitialState {
  data: {
    assetCode: string;
    assetIssuer: string;
    token: string;
    fields: {
      transaction: AnyObject;
      sender: AnyObject;
      receiver: AnyObject;
    };
    senderSep12Type: string;
    receiverSep12Type: string;
    senderSep12Memo: string;
    receiverSep12Memo: string;
    authEndpoint: string;
    sendServer: string;
    kycServer: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface Setting {
  [key: string]: any;
}

export interface TrustAssetInitialState {
  assetString: string;
  data: any;
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface Sep24WithdrawAssetInitialState {
  data: {
    currentStatus: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface TrustAssetParam {
  assetString: string;
  assetCode: string;
  assetIssuer: string;
}

export enum LogType {
  REQUEST = "request",
  RESPONSE = "response",
  INSTRUCTION = "instruction",
  ERROR = "error",
}

export interface LogItemProps {
  timestamp: number;
  type: LogType;
  title: string;
  body?: string | object;
}

export interface Store {
  account: AccountInitialState;
  activeAsset: ActiveAssetInitialState;
  claimAsset: ClaimAssetInitialState;
  claimableBalances: ClaimableBalancesInitialState;
  logs: LogsInitialState;
  sendPayment: SendPaymentInitialState;
  sep31Send: Sep31SendInitialState;
  sep24DepositAsset: Sep24DepositAssetInitialState;
  sep24WithdrawAsset: Sep24WithdrawAssetInitialState;
  settings: SettingsInitialState;
  trustAsset: TrustAssetInitialState;
  untrustedAssets: UntrustedAssetsInitialState;
}

export type StoreKey = keyof Store;

export enum NetworkType {
  PUBLIC = "public",
  TESTNET = "testnet",
}

export enum ActionStatus {
  ERROR = "ERROR",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  NEEDS_INPUT = "NEEDS_INPUT",
}

export interface RejectMessage {
  errorString: string;
}

export interface PaymentTransactionParams {
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  destination: string;
  isDestinationFunded: boolean;
  publicKey: string;
}

export interface CleanedClaimableBalanceRecord
  extends ServerApi.ClaimableBalanceRecord {
  links: undefined;
  pagingToken: undefined;
  self: undefined;
}

export interface ActiveAsset {
  id: string;
  title: string;
  description?: string;
  callback: (args?: any) => void;
  options?: ReactNode;
}

export interface AssetActionItem extends ActiveAsset {
  balance: Asset;
}

export enum AssetActionId {
  SEND_PAYMENT = "send-payment",
  SEP24_DEPOSIT = "sep24-deposit",
  SEP24_WITHDRAW = "sep24-withdraw",
  SEP31_SEND = "sep31-send",
  TRUST_ASSET = "trust-asset",
}

export enum AssetType {
  NATIVE = "native",
}
