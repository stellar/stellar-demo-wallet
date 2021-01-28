import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { TextButton } from "@stellar/design-system";
import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { CopyWithTooltip } from "components/CopyWithTooltip";
import { SendPayment } from "components/SendPayment";
import { UntrustedBalance } from "components/UntrustedBalance";
import { fetchAccountAction } from "ducks/account";
import { resetDepositAssetAction } from "ducks/depositAsset";
import { resetWithdrawAssetAction } from "ducks/withdrawAsset";
import { resetTrustAssetAction } from "ducks/trustAsset";
import { removeUntrustedAssetAction } from "ducks/untrustedAssets";
import { removeUntrustedAssetSearchParam } from "helpers/removeUntrustedAssetSearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Account = () => {
  const { account, depositAsset, trustAsset, withdrawAsset } = useRedux(
    "account",
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
    }
  }, [
    depositAsset.status,
    depositAsset.data.currentStatus,
    depositAsset.data.trustedAssetAdded,
    handleRefreshAccount,
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

  const handleSendPayment = () => {
    setIsSendPaymentVisible(true);
  };

  const handleSendPaymentCancel = () => {
    setIsSendPaymentVisible(false);
  };

  if (!account.data?.id) {
    return null;
  }

  return (
    <div className="Inset">
      {/* Balances */}
      <Balance onSend={handleSendPayment} />
      <UntrustedBalance />
      <ClaimableBalance />

      {/* Send payment */}
      {/* TODO: pre-fill fields from selected asset */}
      {isSendPaymentVisible && (
        <SendPayment onCancel={handleSendPaymentCancel} />
      )}

      {/* Copy keys */}
      <div style={{ display: "flex" }}>
        <CopyWithTooltip copyText={account.data.id}>
          <TextButton>Copy Address</TextButton>
        </CopyWithTooltip>
        <CopyWithTooltip copyText={account.secretKey}>
          <TextButton>Copy Secret</TextButton>
        </CopyWithTooltip>
      </div>

      {/* Refresh account */}
      <TextButton onClick={handleRefreshAccount}>Refresh account</TextButton>

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
