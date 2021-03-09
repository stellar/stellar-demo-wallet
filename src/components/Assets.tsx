import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { Button, Heading2, Loader } from "@stellar/design-system";

import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { ConfirmAssetAction } from "components/ConfirmAssetAction";
import { Modal } from "components/Modal";
import { ToastBanner } from "components/ToastBanner";
import { UntrustedBalance } from "components/UntrustedBalance";

import { fetchAccountAction } from "ducks/account";
import {
  setActiveAsset,
  setActiveAssetStatus,
  resetActiveAsset,
} from "ducks/activeAsset";
import { resetClaimAssetAction } from "ducks/claimAsset";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { resetSep24DepositAssetAction } from "ducks/sep24DepositAsset";
import { resetTrustAssetAction } from "ducks/trustAsset";
import {
  removeUntrustedAssetAction,
  resetUntrustedAssetStatusAction,
} from "ducks/untrustedAssets";
import { resetSep24WithdrawAssetAction } from "ducks/sep24WithdrawAsset";

import { removeUntrustedAssetSearchParam } from "helpers/removeUntrustedAssetSearchParam";
import { useRedux } from "hooks/useRedux";
import {
  Asset,
  ActionStatus,
  AssetActionItem,
  TransactionStatus,
} from "types/types.d";

export const Assets = ({
  onSendPayment,
}: {
  onSendPayment: (asset?: Asset) => void;
}) => {
  const {
    account,
    activeAsset,
    claimAsset,
    sep24DepositAsset,
    sep24WithdrawAsset,
    sep31Send,
    trustAsset,
    untrustedAssets,
  } = useRedux(
    "account",
    "activeAsset",
    "claimAsset",
    "sep24DepositAsset",
    "sep24WithdrawAsset",
    "sep31Send",
    "trustAsset",
    "untrustedAssets",
  );

  const [activeModal, setActiveModal] = useState("");
  const [toastMessage, setToastMessage] = useState<string | React.ReactNode>();

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

  const setActiveAssetStatusAndToastMessage = useCallback(
    ({
      status,
      message,
    }: {
      status: ActionStatus | undefined;
      message: string | React.ReactNode;
    }) => {
      if (!status) {
        return;
      }

      if (status === ActionStatus.SUCCESS || status === ActionStatus.ERROR) {
        dispatch(resetActiveAsset());
      }

      if (
        status === ActionStatus.PENDING ||
        status === ActionStatus.NEEDS_INPUT
      ) {
        dispatch(setActiveAssetStatus(ActionStatus.PENDING));
        setToastMessage(message);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!activeAsset.asset) {
      setToastMessage(undefined);
    }
  }, [activeAsset.asset]);

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

    setActiveAssetStatusAndToastMessage({
      status: trustAsset.status,
      message: "Trust asset in progress",
    });
  }, [
    trustAsset.status,
    trustAsset.assetString,
    handleRefreshAccount,
    setActiveAssetStatusAndToastMessage,
    location,
    dispatch,
    history,
  ]);

  // Deposit asset
  useEffect(() => {
    if (sep24DepositAsset.status === ActionStatus.SUCCESS) {
      dispatch(resetSep24DepositAssetAction());

      if (sep24DepositAsset.data.trustedAssetAdded) {
        handleRemoveUntrustedAsset(sep24DepositAsset.data.trustedAssetAdded);
      }

      if (
        sep24DepositAsset.data.currentStatus === TransactionStatus.COMPLETED
      ) {
        handleRefreshAccount();
        handleFetchClaimableBalances();
      }
    }

    setActiveAssetStatusAndToastMessage({
      status: sep24DepositAsset.status,
      message: "SEP-24 deposit in progress",
    });
  }, [
    sep24DepositAsset.status,
    sep24DepositAsset.data.currentStatus,
    sep24DepositAsset.data.trustedAssetAdded,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    handleRemoveUntrustedAsset,
    setActiveAssetStatusAndToastMessage,
    location,
    dispatch,
    history,
  ]);

  // Withdraw asset
  useEffect(() => {
    if (sep24WithdrawAsset.status === ActionStatus.SUCCESS) {
      dispatch(resetSep24WithdrawAssetAction());

      if (
        sep24WithdrawAsset.data.currentStatus === TransactionStatus.COMPLETED
      ) {
        handleRefreshAccount();
      }
    }

    setActiveAssetStatusAndToastMessage({
      status: sep24WithdrawAsset.status,
      message: "SEP-24 withdrawal in progress",
    });
  }, [
    sep24WithdrawAsset.status,
    sep24WithdrawAsset.data.currentStatus,
    handleRefreshAccount,
    setActiveAssetStatusAndToastMessage,
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

    setActiveAssetStatusAndToastMessage({
      status: claimAsset.status,
      message: "Claim asset in progress",
    });
  }, [
    claimAsset.status,
    claimAsset.data.trustedAssetAdded,
    account.data?.id,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    handleRemoveUntrustedAsset,
    setActiveAssetStatusAndToastMessage,
    dispatch,
  ]);

  // SEP-31 Send
  useEffect(() => {
    setActiveAssetStatusAndToastMessage({
      status: sep31Send.status,
      message: "SEP-31 send in progress",
    });
  }, [sep31Send.status, setActiveAssetStatusAndToastMessage]);

  // Remove untrusted asset
  useEffect(() => {
    if (
      untrustedAssets.status === ActionStatus.SUCCESS ||
      untrustedAssets.status === ActionStatus.ERROR
    ) {
      dispatch(resetUntrustedAssetStatusAction());
      dispatch(resetActiveAsset());
    }
  }, [untrustedAssets.status, setActiveAssetStatusAndToastMessage, dispatch]);

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
          <Button
            onClick={() => setActiveModal(modalType.ADD_ASSET)}
            disabled={Boolean(activeAsset.asset)}
          >
            Add asset
          </Button>
        </div>
      </div>

      {/* Claimable balances */}
      <ClaimableBalance onAssetAction={handleAssetAction} />

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

      <ToastBanner parentId="app-wrapper" visible={Boolean(toastMessage)}>
        <div className="Inline">
          <div>{toastMessage}</div>
          <Loader />
        </div>
      </ToastBanner>
    </>
  );
};
