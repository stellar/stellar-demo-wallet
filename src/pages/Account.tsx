import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Loader, TextButton } from "@stellar/design-system";

import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { CopyWithTooltip } from "components/CopyWithTooltip";
import { SendPayment } from "components/SendPayment";
import { Sep31Send } from "components/Sep31Send";
import { UntrustedBalance } from "components/UntrustedBalance";

import { fetchAccountAction, fundTestnetAccount } from "ducks/account";
import { resetClaimAssetAction } from "ducks/claimAsset";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { resetDepositAssetAction } from "ducks/depositAsset";
import { resetTrustAssetAction } from "ducks/trustAsset";
import { removeUntrustedAssetAction } from "ducks/untrustedAssets";
import { resetWithdrawAssetAction } from "ducks/withdrawAsset";

import { removeUntrustedAssetSearchParam } from "helpers/removeUntrustedAssetSearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Account = () => {
  const {
    account,
    claimAsset,
    depositAsset,
    trustAsset,
    withdrawAsset,
  } = useRedux(
    "account",
    "claimAsset",
    "depositAsset",
    "trustAsset",
    "withdrawAsset",
  );
  const [isSendPaymentVisible, setIsSendPaymentVisible] = useState(false);
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);
  const [isAddAssetVisible, setIsAddAssetVisible] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleRefreshAccount = useCallback(() => {
    if (account.data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: account.data.id,
          secretKey: account.secretKey,
        }),
      );
    }
  }, [account.data?.id, account.secretKey, dispatch]);

  const handleFetchClaimableBalances = useCallback(() => {
    if (account.data?.id) {
      dispatch(fetchClaimableBalancesAction({ publicKey: account.data.id }));
    }
  }, [account.data?.id, dispatch]);

  // Trust asset
  useEffect(() => {
    if (trustAsset.status === ActionStatus.SUCCESS) {
      history.push(
        removeUntrustedAssetSearchParam({
          location,
          removeAsset: trustAsset.assetString,
        }),
      );
      dispatch(removeUntrustedAssetAction(trustAsset.assetString));
      dispatch(resetTrustAssetAction());
      handleRefreshAccount();
    }
  }, [
    trustAsset.status,
    trustAsset.assetString,
    handleRefreshAccount,
    location,
    dispatch,
    history,
  ]);

  // Deposit asset
  useEffect(() => {
    if (
      depositAsset.status === ActionStatus.SUCCESS &&
      depositAsset.data.currentStatus === "completed"
    ) {
      const removeAsset = depositAsset.data.trustedAssetAdded;

      if (removeAsset) {
        history.push(
          removeUntrustedAssetSearchParam({
            location,
            removeAsset,
          }),
        );
        dispatch(removeUntrustedAssetAction(removeAsset));
      }

      dispatch(resetDepositAssetAction());
      handleRefreshAccount();
      handleFetchClaimableBalances();
    }
  }, [
    depositAsset.status,
    depositAsset.data.currentStatus,
    depositAsset.data.trustedAssetAdded,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    location,
    dispatch,
    history,
  ]);

  // Withdraw asset
  useEffect(() => {
    if (
      withdrawAsset.status === ActionStatus.SUCCESS &&
      withdrawAsset.data.currentStatus === "completed"
    ) {
      dispatch(resetWithdrawAssetAction());
      handleRefreshAccount();
    }
  }, [
    withdrawAsset.status,
    withdrawAsset.data.currentStatus,
    handleRefreshAccount,
    location,
    dispatch,
    history,
  ]);

  // Claim asset
  useEffect(() => {
    if (claimAsset.status === ActionStatus.SUCCESS) {
      dispatch(resetClaimAssetAction());
      handleRefreshAccount();
      handleFetchClaimableBalances();
    }
  }, [
    claimAsset.status,
    account.data?.id,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    dispatch,
  ]);

  const handleSendPayment = () => {
    setIsSendPaymentVisible(true);
  };

  const handleSendPaymentCancel = () => {
    setIsSendPaymentVisible(false);
  };

  const handleCreateAccount = () => {
    if (account.data?.id) {
      dispatch(fundTestnetAccount(account.data.id));
    }
  };

  if (!account.data?.id) {
    return null;
  }

  return (
    <div className="Inset">
      {account.status === ActionStatus.PENDING && (
        <div className="Inline">
          <span>Updating account</span>
          <Loader />
        </div>
      )}

      {/* Balances */}
      <Balance onSend={handleSendPayment} />
      <UntrustedBalance />
      <ClaimableBalance />

      {/* Send payment */}
      {/* TODO: pre-fill fields from selected asset */}
      {isSendPaymentVisible && (
        <SendPayment onCancel={handleSendPaymentCancel} />
      )}

      {/* SEP-31 Send */}
      <Sep31Send />

      {/* Copy keys */}
      <div style={{ display: "flex" }}>
        <CopyWithTooltip copyText={account.data.id}>
          <TextButton>Copy Address</TextButton>
        </CopyWithTooltip>
        <CopyWithTooltip copyText={account.secretKey}>
          <TextButton>Copy Secret</TextButton>
        </CopyWithTooltip>
      </div>

      {account.isUnfunded && (
        <TextButton
          onClick={handleCreateAccount}
          disabled={account.status === ActionStatus.PENDING}
        >
          Create account
        </TextButton>
      )}

      {/* Refresh account */}
      <TextButton
        onClick={handleRefreshAccount}
        disabled={account.status === ActionStatus.PENDING}
      >
        Refresh account
      </TextButton>

      {/* Add asset */}
      <div>
        <TextButton onClick={() => setIsAddAssetVisible(true)}>
          Add asset
        </TextButton>
        {isAddAssetVisible && (
          <AddAsset onCancel={() => setIsAddAssetVisible(false)} />
        )}
      </div>

      {/* Account details */}
      <div>
        <TextButton
          onClick={() => setIsAccountDetailsVisible(!isAccountDetailsVisible)}
        >{`${
          isAccountDetailsVisible ? "Hide" : "Show"
        } Account Details`}</TextButton>

        {isAccountDetailsVisible && (
          <pre>{JSON.stringify(account.data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};
