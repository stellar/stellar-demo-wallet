import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Heading2 } from "@stellar/design-system";
import { Types } from "@stellar/wallet-sdk";

import { AccountInfo } from "components/AccountInfo";
import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { Modal } from "components/Modal";
import { SendPayment } from "components/SendPayment";
import { Sep31Send } from "components/Sep31Send";
import { UntrustedBalance } from "components/UntrustedBalance";

import { fetchAccountAction } from "ducks/account";
import { resetClaimAssetAction } from "ducks/claimAsset";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { resetSep24DepositAssetAction } from "ducks/sep24DepositAsset";
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
    sep24DepositAsset,
    trustAsset,
    withdrawAsset,
  } = useRedux(
    "account",
    "claimAsset",
    "sep24DepositAsset",
    "trustAsset",
    "withdrawAsset",
  );
  const [activeModal, setActiveModal] = useState("");
  const [currentAsset, setCurrentAsset] = useState<
    Types.AssetBalance | undefined
  >();

  enum modalType {
    SEND_PAYMENT = "SEND_PAYMENT",
    ADD_ASSET = "ADD_ASSET",
  }

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const handleRemoveUntrustedAsset = useCallback(
    (removeAsset?: string) => {
      if (removeAsset) {
        history.push(
          removeUntrustedAssetSearchParam({
            location,
            removeAsset,
          }),
        );
        dispatch(removeUntrustedAssetAction(removeAsset));
      }
    },
    [history, location, dispatch],
  );

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

  const handleCloseModal = () => {
    setActiveModal("");
  };

  const handleSendPayment = (asset?: Types.AssetBalance) => {
    setCurrentAsset(asset);
    setActiveModal(modalType.SEND_PAYMENT);
  };

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
      sep24DepositAsset.status === ActionStatus.SUCCESS &&
      sep24DepositAsset.data.currentStatus === "completed"
    ) {
      handleRemoveUntrustedAsset(sep24DepositAsset.data.trustedAssetAdded);
      dispatch(resetSep24DepositAssetAction());
      handleRefreshAccount();
      handleFetchClaimableBalances();
    }
  }, [
    sep24DepositAsset.status,
    sep24DepositAsset.data.currentStatus,
    sep24DepositAsset.data.trustedAssetAdded,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    handleRemoveUntrustedAsset,
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
      handleRemoveUntrustedAsset(claimAsset.data.trustedAssetAdded);
      dispatch(resetClaimAssetAction());
      handleRefreshAccount();
      handleFetchClaimableBalances();
    }
  }, [
    claimAsset.status,
    claimAsset.data.trustedAssetAdded,
    account.data?.id,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    handleRemoveUntrustedAsset,
    dispatch,
  ]);

  if (!account.data?.id) {
    return null;
  }

  return (
    <div className="Inset">
      {/* Account */}
      <AccountInfo />

      {/* Balances */}
      <div className="Section">
        <Heading2>Balances</Heading2>
        <div className="Balances">
          <Balance onSend={handleSendPayment} />
          <UntrustedBalance />
        </div>

        <div className="BalancesButtons">
          <Button onClick={() => setActiveModal(modalType.ADD_ASSET)}>
            Add asset
          </Button>
        </div>
      </div>

      {/* Claimable balances */}
      <ClaimableBalance />

      {/* SEP-31 Send */}
      <Sep31Send />

      <Modal visible={Boolean(activeModal)} onClose={handleCloseModal}>
        {/* Add asset */}
        {activeModal === modalType.ADD_ASSET && (
          <AddAsset onClose={handleCloseModal} />
        )}

        {/* Send payment */}
        {activeModal === modalType.SEND_PAYMENT && (
          <SendPayment asset={currentAsset} onClose={handleCloseModal} />
        )}
      </Modal>
    </div>
  );
};
