import { Horizon, Types } from "stellar-sdk";

export interface AccountInitialState {
  data: Types.AccountDetails | null;
  errorString?: string;
  isAuthenticated: boolean;
  secretKey: string;
  status: ActionStatus | undefined;
}

export interface SendPaymentInitialState {
  data: Horizon.TransactionResponse | null;
  errorString?: string;
  status: ActionStatus | undefined;
}

export interface SettingsInitialState {
  secretKey: string;
  pubnet?: boolean;
}

export interface Setting {
  [key: string]: any;
}

export interface Store {
  account: AccountInitialState;
  sendPayment: SendPaymentInitialState;
  settings: SettingsInitialState;
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
