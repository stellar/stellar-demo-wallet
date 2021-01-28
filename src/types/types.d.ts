import { Types } from "@stellar/wallet-sdk";
import { Horizon, ServerApi } from "stellar-sdk";

export interface AccountInitialState {
  data: Types.AccountDetails | null;
  errorString?: string;
  isAuthenticated: boolean;
  secretKey: string;
  status: ActionStatus | undefined;
}

export interface ClaimAssetInitialState {
  data: {
    result: any;
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

export interface DepositAssetInitialState {
  data: {
    currentStatus: string;
    trustedAssetAdded?: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface SendPaymentInitialState {
  data: Horizon.TransactionResponse | null;
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface SettingsInitialState {
  pubnet?: boolean;
  secretKey: string;
  untrustedAssets: string;
}

export interface UntrustedAssetsInitialState {
  data: UntrustedAsset[];
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

export interface WithdrawAssetInitialState {
  data: {
    currentStatus: string;
  };
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface UntrustedAsset {
  assetCode: string;
  assetIssuer: string;
  assetString: string;
  assetType: string;
  balance: string;
  untrusted: boolean;
}

export interface TrustAssetParam {
  assetString: string;
  assetCode: string;
  assetIssuer: string;
}

export interface Store {
  account: AccountInitialState;
  claimAsset: ClaimAssetInitialState;
  claimableBalances: ClaimableBalancesInitialState;
  depositAsset: DepositAssetInitialState;
  sendPayment: SendPaymentInitialState;
  settings: SettingsInitialState;
  trustAsset: TrustAssetInitialState;
  untrustedAssets: UntrustedAssetsInitialState;
  withdrawAsset: WithdrawAssetInitialState;
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
