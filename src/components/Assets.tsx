import React, { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { Button, Heading2, Loader, TextButton } from "@stellar/design-system";

import { AddAsset } from "components/AddAsset";
import { AddPresetAsset } from "components/AddPresetAsset";
import { Balance } from "components/Balance";
import { ClaimableBalance } from "components/ClaimableBalance";
import { ConfirmAssetAction } from "components/ConfirmAssetAction";
import { Modal } from "components/Modal";
import { ToastBanner } from "components/ToastBanner";
import { UntrustedBalance } from "components/UntrustedBalance";

import { fetchAccountAction, resetAccountStatusAction } from "ducks/account";
import {
  setActiveAssetAction,
  setActiveAssetStatusAction,
  resetActiveAssetAction,
} from "ducks/activeAsset";
import {
  getAllAssetsAction,
  resetAllAssetsStatusAction,
} from "ducks/allAssets";
import {
  addAssetOverridesAction,
  resetAssetOverridesStatusAction,
} from "ducks/assetOverrides";
import { resetClaimAssetAction } from "ducks/claimAsset";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { resetSep24DepositAssetAction } from "ducks/sep24DepositAsset";
import { resetTrustAssetAction } from "ducks/trustAsset";
import {
  removeUntrustedAssetAction,
  resetUntrustedAssetStatusAction,
} from "ducks/untrustedAssets";
import { resetSep24WithdrawAssetAction } from "ducks/sep24WithdrawAsset";

import { getPresetAssets } from "helpers/getPresetAssets";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import {
  Asset,
  ActionStatus,
  AssetActionItem,
  SearchParams,
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
    allAssets,
    assetOverrides,
    claimAsset,
    sep6DepositAsset,
    sep6WithdrawAsset,
    sep24DepositAsset,
    sep24WithdrawAsset,
    sep31Send,
    settings,
    trustAsset,
    untrustedAssets,
  } = useRedux(
    "account",
    "activeAsset",
    "allAssets",
    "assetOverrides",
    "claimAsset",
    "sep6DepositAsset",
    "sep6WithdrawAsset",
    "sep24DepositAsset",
    "sep24WithdrawAsset",
    "sep31Send",
    "settings",
    "trustAsset",
    "untrustedAssets",
  );

  const [activeModal, setActiveModal] = useState("");
  const [toastMessage, setToastMessage] = useState<string | React.ReactNode>();

  const dispatch = useDispatch();
  const history = useHistory();

  enum ModalType {
    ADD_ASSET = "ADD_ASSET",
    ADD_PRESET_ASSET = "ADD_PRESET_ASSET",
    CONFIRM_ACTION = "CONFIRM_ACTION",
  }

  const handleRemoveUntrustedAsset = useCallback(
    (removeAsset?: string) => {
      if (removeAsset) {
        history.push(
          searchParam.remove(SearchParams.UNTRUSTED_ASSETS, removeAsset),
        );
        dispatch(removeUntrustedAssetAction(removeAsset));
      }
    },
    [history, dispatch],
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
    dispatch(resetActiveAssetAction());
  };

  const handleAssetAction = ({
    assetString,
    balance,
    callback,
    title,
    description,
    options,
  }: AssetActionItem) => {
    setActiveModal(ModalType.CONFIRM_ACTION);
    dispatch(
      setActiveAssetAction({
        assetString,
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
        dispatch(resetActiveAssetAction());
      }

      if (
        status === ActionStatus.PENDING ||
        status === ActionStatus.NEEDS_INPUT
      ) {
        dispatch(setActiveAssetStatusAction(ActionStatus.PENDING));
        setToastMessage(message);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!activeAsset.action) {
      setToastMessage(undefined);
    }
  }, [activeAsset.action]);

  useEffect(() => {
    if (account.status === ActionStatus.SUCCESS) {
      dispatch(resetAccountStatusAction());
      dispatch(getAllAssetsAction());
    }
  }, [account.status, dispatch]);

  useEffect(() => {
    if (allAssets.status === ActionStatus.SUCCESS) {
      dispatch(resetAllAssetsStatusAction());
    }
  }, [allAssets.status, dispatch]);

  useEffect(() => {
    dispatch(addAssetOverridesAction(settings.assetOverrides));
  }, [settings.assetOverrides, dispatch]);

  useEffect(() => {
    if (assetOverrides.status === ActionStatus.SUCCESS) {
      dispatch(resetAssetOverridesStatusAction());
      dispatch(getAllAssetsAction());
    }
  }, [assetOverrides.status, dispatch]);

  // Trust asset
  useEffect(() => {
    if (trustAsset.status === ActionStatus.SUCCESS) {
      history.push(
        searchParam.remove(
          SearchParams.UNTRUSTED_ASSETS,
          trustAsset.assetString,
        ),
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
    dispatch,
    history,
  ]);

  // SEP-6 Deposit asset
  useEffect(() => {
    if (
      sep6DepositAsset.status === ActionStatus.SUCCESS &&
      sep6DepositAsset.data.trustedAssetAdded
    ) {
      handleRemoveUntrustedAsset(sep6DepositAsset.data.trustedAssetAdded);
    }

    if (sep6DepositAsset.data.currentStatus === TransactionStatus.COMPLETED) {
      handleRefreshAccount();
      handleFetchClaimableBalances();
    }

    setActiveAssetStatusAndToastMessage({
      status: sep6DepositAsset.status,
      message: "SEP-6 deposit in progress",
    });
  }, [
    sep6DepositAsset.status,
    sep6DepositAsset.data.currentStatus,
    sep6DepositAsset.data.trustedAssetAdded,
    handleRefreshAccount,
    handleFetchClaimableBalances,
    handleRemoveUntrustedAsset,
    setActiveAssetStatusAndToastMessage,
  ]);

  // SEP-6 Withdraw asset
  useEffect(() => {
    if (
      sep6WithdrawAsset.status === ActionStatus.SUCCESS &&
      sep6WithdrawAsset.data.currentStatus === TransactionStatus.COMPLETED
    ) {
      handleRefreshAccount();
    }

    setActiveAssetStatusAndToastMessage({
      status: sep6WithdrawAsset.status,
      message: "SEP-6 withdrawal in progress",
    });
  }, [
    sep6WithdrawAsset.status,
    sep6WithdrawAsset.data.currentStatus,
    handleRefreshAccount,
    setActiveAssetStatusAndToastMessage,
  ]);

  // SEP-24 Deposit asset
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
    dispatch,
    history,
  ]);

  // SEP-24 Withdraw asset
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
      dispatch(getAllAssetsAction());
      dispatch(resetUntrustedAssetStatusAction());
      dispatch(resetActiveAssetAction());
    }
  }, [untrustedAssets.status, dispatch]);

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
            onClick={() => setActiveModal(ModalType.ADD_ASSET)}
            disabled={Boolean(activeAsset.action)}
          >
            Add asset
          </Button>

          {!settings.pubnet && getPresetAssets(allAssets.data).length > 0 && (
            <TextButton
              onClick={() => setActiveModal(ModalType.ADD_PRESET_ASSET)}
              disabled={Boolean(activeAsset.action)}
            >
              Select from preset assets
            </TextButton>
          )}
        </div>
      </div>

      {/* Claimable balances */}
      <ClaimableBalance onAssetAction={handleAssetAction} />

      <Modal visible={Boolean(activeModal)} onClose={handleCloseModal}>
        {/* Action confirmation */}
        {activeModal === ModalType.CONFIRM_ACTION && (
          <ConfirmAssetAction onClose={handleCloseModal} />
        )}

        {/* Add asset */}
        {activeModal === ModalType.ADD_ASSET && (
          <AddAsset onClose={handleCloseModal} />
        )}

        {/* Add preset asset */}
        {activeModal === ModalType.ADD_PRESET_ASSET && (
          <AddPresetAsset onClose={handleCloseModal} />
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
