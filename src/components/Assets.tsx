import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Heading2 } from "@stellar/design-system";

import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { ConfirmAssetAction } from "components/ConfirmAssetAction";
import { Modal } from "components/Modal";
import { UntrustedBalance } from "components/UntrustedBalance";

import { fetchAccountAction } from "ducks/account";
import { setActiveAsset, resetActiveAsset } from "ducks/activeAsset";
import { resetClaimAssetAction } from "ducks/claimAsset";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { resetSep24DepositAssetAction } from "ducks/sep24DepositAsset";
import { resetTrustAssetAction } from "ducks/trustAsset";
import { removeUntrustedAssetAction } from "ducks/untrustedAssets";
import { resetSep24WithdrawAssetAction } from "ducks/sep24WithdrawAsset";

import { removeUntrustedAssetSearchParam } from "helpers/removeUntrustedAssetSearchParam";
import { useRedux } from "hooks/useRedux";
import { Asset, ActionStatus, AssetActionItem } from "types/types.d";

export const Assets = ({
  onSendPayment,
}: {
  onSendPayment: (asset?: Asset) => void;
}) => {
  const {
    account,
    claimAsset,
    sep24DepositAsset,
    sep24WithdrawAsset,
    trustAsset,
  } = useRedux(
    "account",
    "claimAsset",
    "sep24DepositAsset",
    "sep24WithdrawAsset",
    "trustAsset",
  );

  const [activeModal, setActiveModal] = useState("");

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  enum modalType {
    ADD_ASSET = "ADD_ASSET",
    CONFIRM_ACTION = "CONFIRM_ACTION",
  }

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
    dispatch(resetActiveAsset());
  };

  const handleAssetAction = ({
    id,
    balance,
    callback,
    title,
    description,
    options,
  }: AssetActionItem) => {
    setActiveModal(modalType.CONFIRM_ACTION);
    dispatch(
      setActiveAsset({
        id,
        title,
        description,
        callback: () => {
          setActiveModal("");
          callback(balance);
        },
        options,
      }),
    );
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
      sep24WithdrawAsset.status === ActionStatus.SUCCESS &&
      sep24WithdrawAsset.data.currentStatus === "completed"
    ) {
      dispatch(resetSep24WithdrawAssetAction());
      handleRefreshAccount();
    }
  }, [
    sep24WithdrawAsset.status,
    sep24WithdrawAsset.data.currentStatus,
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

  return (
    <>
      {/* Balances */}
      <div className="Section">
        <div className="Inset">
          <Heading2>Balances</Heading2>
        </div>
        <div className="Balances">
          <Balance onSend={onSendPayment} onAssetAction={handleAssetAction} />
          <UntrustedBalance onAssetAction={handleAssetAction} />
        </div>

        <div className="BalancesButtons Inset">
          <Button onClick={() => setActiveModal(modalType.ADD_ASSET)}>
            Add asset
          </Button>
        </div>
      </div>

      {/* Claimable balances */}
      <ClaimableBalance />

      <Modal visible={Boolean(activeModal)} onClose={handleCloseModal}>
        {/* Action confirmation */}
        {activeModal === modalType.CONFIRM_ACTION && (
          <ConfirmAssetAction onClose={handleCloseModal} />
        )}

        {/* Add asset */}
        {activeModal === modalType.ADD_ASSET && (
          <AddAsset onClose={handleCloseModal} />
        )}
      </Modal>
    </>
  );
};
