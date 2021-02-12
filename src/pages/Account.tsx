import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Loader, TextButton, TextLink } from "@stellar/design-system";

import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { CopyWithText } from "components/CopyWithText";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";
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

import { shortenStellarKey } from "helpers/shortenStellarKey";
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
        <div className="Inline LoadingBlock">
          <span>Updating account</span>
          <Loader />
        </div>
      )}

      <div className="Account">
        {/* Account keys */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Public</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.data.id)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyWithText textToCopy={account.data.id} />
            </div>
          </div>
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Secret</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.secretKey)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyWithText textToCopy={account.secretKey} />
            </div>
          </div>
        </div>

        {/* Account actions */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              {account.isUnfunded && (
                <div className="InfoButtonWrapper">
                  <TextButton
                    onClick={handleCreateAccount}
                    disabled={account.status === ActionStatus.PENDING}
                  >
                    Create account
                  </TextButton>

                  {/* TODO: add link */}
                  <InfoButtonWithTooltip>
                    Clicking create will fund your test account with XLM. If
                    you’re testing SEP-24 you may want to leave this account
                    unfunded.{" "}
                    <TextLink href="#" target="_blank" rel="noreferrer">
                      Learn more
                    </TextLink>
                  </InfoButtonWithTooltip>
                </div>
              )}

              {!account.isUnfunded && (
                <TextButton
                  onClick={() =>
                    setIsAccountDetailsVisible(!isAccountDetailsVisible)
                  }
                >{`${
                  isAccountDetailsVisible ? "Hide" : "Show"
                } account details`}</TextButton>
              )}
            </div>
          </div>

          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              <div className="InfoButtonWrapper">
                <TextButton
                  onClick={handleRefreshAccount}
                  disabled={account.status === ActionStatus.PENDING}
                >
                  Refresh account
                </TextButton>

                <InfoButtonWithTooltip>
                  If you performed account actions elsewhere, like in the
                  Stellar Laboratory, click here to update.
                </InfoButtonWithTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODO: needs styling */}
      {/* Account details */}
      {isAccountDetailsVisible && (
        <div>
          <pre>{JSON.stringify(account.data, null, 2)}</pre>
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

      {/* Add asset */}
      <div>
        <TextButton onClick={() => setIsAddAssetVisible(true)}>
          Add asset
        </TextButton>
        {isAddAssetVisible && (
          <AddAsset onCancel={() => setIsAddAssetVisible(false)} />
        )}
      </div>
    </div>
  );
};
