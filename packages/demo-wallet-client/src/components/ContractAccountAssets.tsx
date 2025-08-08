import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Heading2,
  Layout, Loader,
  Modal,
  TextLink,
} from "@stellar/design-system";
import { useRedux } from "../hooks/useRedux";
import { BalanceRow } from "./BalanceRow";
import { AddContractAsset } from "./AddContractAsset";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { AppDispatch } from "../config/store";
import { useDispatch } from "react-redux";
import {
  fetchContractAssetsAction,
  removeContractAssetAction,
  resetContractAssetsAction,
  resetContractAssetStatusAction,
} from "../ducks/contractAssets";
import {
  ActionStatus,
  Asset,
  AssetActionItem,
  SearchParams,
  AssetActionId,
  TransactionStatus,
} from "../types/types";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { log } from "demo-wallet-shared/build/helpers/log";
import { useNavigate } from "react-router-dom";
import {
  getPresetAssets
} from "demo-wallet-shared/build/helpers/getPresetAssets";
import {
  PRESET_CONTRACT_ASSETS
} from "demo-wallet-shared/build/constants/presetAssets";
import { AddPresetContractAsset } from "./AddPresetContractAsset";
import {
  resetActiveAssetAction,
  setActiveAssetAction, setActiveAssetStatusAction,
} from "../ducks/activeAsset";
import { ConfirmAssetAction } from "./ConfirmAssetAction";
// Import SEP action handlers
import { initiateWithdrawAction as initiateSep6WithdrawAction } from "ducks/sep6Withdraw";
import { initiateSep8SendAction } from "ducks/sep8Send";
import {
  initiateDepositAction as initiateSep6DepositAction,
  resetSep6DepositAction,
} from "ducks/sep6Deposit";
import {
  depositAssetAction as initiateSep24DepositAction,
  resetSep24DepositAssetAction,
} from "ducks/sep24DepositAsset";
import {
  withdrawAssetAction as initiateSep24WithdrawAction,
  resetSep24WithdrawAssetAction,
} from "ducks/sep24WithdrawAsset";
import { initiateSendAction as initiateSep31SendAction} from "ducks/sep31Send";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";
import { resetCustodialAction } from "../ducks/custodial";
import { removeExtraAction } from "../ducks/extra";
import { ToastBanner } from "./ToastBanner";

export const ContractAccountAssets = () => {
  const { 
    contractAccount, 
    contractAssets, 
    settings, 
    activeAsset,
    sep6Deposit,
    sep24DepositAsset,
    sep24WithdrawAsset,
  } = useRedux(
    "contractAccount", 
    "contractAssets", 
    "settings", 
    "activeAsset",
    "sep6Deposit",
    "sep24DepositAsset",
    "sep24WithdrawAsset",
  );
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const [toastMessage, setToastMessage] = useState<string | React.ReactNode>();
  const [activeModal, setActiveModal] = useState("");
  enum ModalType {
    ADD_ASSET = "ADD_ASSET",
    ADD_PRESET_ASSET = "ADD_PRESET_ASSET",
    CONFIRM_ACTION = "CONFIRM_ACTION",
  }

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
        dispatch(resetCustodialAction());
        dispatch(removeExtraAction(["sep9Fields", "memo"]));
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

  const handleRefreshAccount = useCallback(() => {
    if (contractAccount.contractId) {
      dispatch(
        fetchContractAssetsAction({
          assetsString: settings.contractAssets,
          contractId: contractAccount.contractId,
          assetOverridesString: settings.assetOverrides || undefined,
        }),
      );
    }
  }, [contractAccount.contractId, dispatch, settings.assetOverrides, settings.contractAssets]);

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
    showCustodial,
    showExtra,
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
        showCustodial,
        showExtra,
      }),
    );
  };

  const onActionSelected = ({
    actionId,
    balance,
  }: {
    actionId: string;
    balance: Asset;
  }) => {
    if (!actionId) {
      return;
    }

    let props: AssetActionItem | undefined;
    const defaultProps = {
      assetString: balance.assetString,
      balance,
    };

    const isNative = isNativeAsset(balance.assetCode);

    switch (actionId) {
      case AssetActionId.SEND_PAYMENT:
        props = {
          ...defaultProps,
          title: `Send ${balance.assetCode}`,
          description: (
            <p>
              {`Send ${balance.assetCode} from contract account to another account.`}{" "}
              <TextLink href="https://developers.stellar.org/docs/tutorials/send-and-receive-payments/">
                Learn more
              </TextLink>
            </p>
          ),
          // TODO(jiahuihu): Implement contract account send payment
          callback: () => {},
        };
        break;
      case AssetActionId.SEP6_DEPOSIT:
        props = {
          ...defaultProps,
          title: `SEP-6 deposit ${balance.assetCode}`,
          description: `Start SEP-6 deposit of ${balance.assetCode} to contract account?`,
          callback: () => dispatch(initiateSep6DepositAction(balance)),
        };
        break;
      case AssetActionId.SEP6_WITHDRAW:
        props = {
          ...defaultProps,
          title: `SEP-6 withdrawal ${balance.assetCode}`,
          description: `Start SEP-6 withdrawal of ${balance.assetCode} from contract account?`,
          callback: () => dispatch(initiateSep6WithdrawAction(balance)),
        };
        break;
      case AssetActionId.SEP8_SEND_PAYMENT:
        props = {
          ...defaultProps,
          title: `SEP-8 send ${balance.assetCode}`,
          description: (
            <p>
              {`Payments with regulated assets need to be approved by the asset issuer. For more information please refer to`}{" "}
              <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0008.md">
                SEP-8
              </TextLink>
              .
            </p>
          ),
          callback: () => dispatch(initiateSep8SendAction(balance)),
        };
        break;
      case AssetActionId.SEP24_DEPOSIT:
        props = {
          ...defaultProps,
          title: `SEP-24 deposit ${balance.assetCode} ${
            isNative ? "(with Native Asset)" : "(with Trusted Asset)"
          }`,
          description: `Start SEP-24 deposit of ${
            isNative ? "native" : "trusted"
          } asset ${balance.assetCode} to contract account?`,
          callback: () => dispatch(initiateSep24DepositAction(balance)),
          showCustodial: false,
          showExtra: true,
        };
        break;
      case AssetActionId.SEP24_WITHDRAW:
        props = {
          ...defaultProps,
          title: `SEP-24 withdrawal ${balance.assetCode}`,
          description: `Start SEP-24 withdrawal of ${balance.assetCode} from contract account?`,
          callback: () => dispatch(initiateSep24WithdrawAction(balance)),
          showCustodial: false,
          showExtra: true,
        };
        break;
      case AssetActionId.SEP31_SEND: {
        let description = `Start SEP-31 send to ${balance.assetCode} from contract account?\n\n`;
        description +=
          "Please be aware that specifically in the case of demo-ing SEP-31 in the Demo Wallet the public and secret keys don't represent the Sending Client but instead the Sending Anchor's account.\n\n";
        description +=
          "In SEP-31, the only Stellar transaction happening is between the Sending and the Receiving anchors.";
        props = {
          ...defaultProps,
          title: `SEP-31 send ${balance.assetCode}`,
          description,
          callback: () => dispatch(initiateSep31SendAction(balance)),
        };
        break;
      }
      default:
      // do nothing
    }

    if (!props) {
      return;
    }

    handleAssetAction(props);
  };

  const handleRemoveAsset = (asset: Asset) => {
    const { assetString } = asset;

    let search= searchParam.remove(SearchParams.CONTRACT_ASSETS, assetString);
    search = searchParam.removeKeyPair({
      param: SearchParams.ASSET_OVERRIDES,
      itemId: asset.assetString,
      urlSearchParams: new URLSearchParams(search)
    });
    
    navigate(search);
    dispatch(removeContractAssetAction(assetString));
    log.instruction({ title: `Asset \`${assetString}\` removed` });
    dispatch(resetContractAssetStatusAction());
  };

  useEffect(() => {
    // Only proceed if contract account is successfully fetched
    if (contractAccount.status !== ActionStatus.SUCCESS || !contractAccount.contractId) {
      return;
    }

    if (!settings.contractAssets) {
      // Clear the store when no assets in URL
      dispatch(resetContractAssetsAction());
      return;
    }

    // Always fetch fresh data from URL
    dispatch(fetchContractAssetsAction({
      assetsString: settings.contractAssets,
      contractId: contractAccount.contractId,
      assetOverridesString: settings.assetOverrides || undefined,
    }));
  }, [settings.contractAssets, settings.assetOverrides, contractAccount.contractId, dispatch, contractAccount.status]);

  // 4. Auto-clear when action completes
  useEffect(() => {
    if (!activeAsset.action) {
      setToastMessage(undefined);  // Clear local state
    }
  }, [activeAsset.action]);

  // SEP-6 Deposit
  useEffect(() => {
    if (sep6Deposit.status === ActionStatus.SUCCESS) {
      dispatch(resetSep6DepositAction());
    }

    if (sep6Deposit.data.currentStatus === TransactionStatus.COMPLETED) {
      handleRefreshAccount();
    }

    setActiveAssetStatusAndToastMessage({
      status: sep6Deposit.status,
      message: "SEP-6 deposit in progress",
    });
  }, [sep6Deposit.status, sep6Deposit.data.currentStatus, setActiveAssetStatusAndToastMessage, dispatch, handleRefreshAccount]);

  // SEP-24 Deposit asset
  useEffect(() => {
    if (sep24DepositAsset.status === ActionStatus.SUCCESS) {
      dispatch(resetSep24DepositAssetAction());

      if (
        sep24DepositAsset.data.currentStatus === TransactionStatus.COMPLETED
      ) {
        handleRefreshAccount();
      }
    }

    setActiveAssetStatusAndToastMessage({
      status: sep24DepositAsset.status,
      message: "SEP-24 deposit in progress",
    });
  }, [sep24DepositAsset.status, sep24DepositAsset.data.currentStatus, setActiveAssetStatusAndToastMessage, dispatch, handleRefreshAccount]);


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
  }, [sep24WithdrawAsset.status, sep24WithdrawAsset.data.currentStatus, setActiveAssetStatusAndToastMessage, dispatch, handleRefreshAccount]);

  return (
    <>
      <div className="Section">
        <Layout.Inset>
          <Heading2>Balances</Heading2>
        </Layout.Inset>
        <div className="Balances">
          {contractAssets.data.map((asset) => (
            <BalanceRow
              activeAction={activeAsset.action}
              key={asset.assetString}
              asset={asset}
              onAction={(actionId, asset) =>
                onActionSelected({ actionId, balance: asset })
              }
            >
              <TextLink
                onClick={() => handleRemoveAsset(asset)}
              >
                Remove
              </TextLink>
            </BalanceRow>
          ))}
        </div>
        <Layout.Inset>
          <div className="BalancesButtons">
            <Button
              onClick={() => setActiveModal(ModalType.ADD_ASSET)}
              disabled={Boolean(activeAsset.action)}
            >
              Add asset
            </Button>
            {getPresetAssets(contractAssets.data, PRESET_CONTRACT_ASSETS).length > 0 && (
              <TextLink
                onClick={() => setActiveModal(ModalType.ADD_PRESET_ASSET)}
                disabled={Boolean(activeAsset.action)}
              >
                Select from preset assets
              </TextLink>
            )}
          </div>
        </Layout.Inset>
      </div>

      <Modal
        visible={Boolean(activeModal)}
        onClose={handleCloseModal}
        parentId={CSS_MODAL_PARENT_ID}
      >
        {activeModal === ModalType.ADD_ASSET && (
          <AddContractAsset onClose={handleCloseModal} />
        )}
        {activeModal === ModalType.ADD_PRESET_ASSET && (
          <AddPresetContractAsset onClose={handleCloseModal} />
        )}
        {activeModal === ModalType.CONFIRM_ACTION && (
          <ConfirmAssetAction onClose={handleCloseModal} />
        )}
      </Modal>

      <ToastBanner parentId="app-wrapper" visible={Boolean(toastMessage)}>
        <div className="Layout__inline">
          <div>{toastMessage}</div>
          <Loader />
        </div>
      </ToastBanner>
    </>
  );
};