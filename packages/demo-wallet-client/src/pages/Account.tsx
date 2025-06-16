import { useState } from "react";
import { useDispatch } from "react-redux";
import { Modal } from "@stellar/design-system";
import { AccountInfo } from "components/AccountInfo";
import { Assets } from "components/Assets";
import { SendPayment } from "components/SendPayment";
import { Sep6Deposit } from "components/Sep6Deposit";
import { Sep6Withdraw } from "components/Sep6Withdraw";
import { Sep8Send } from "components/Sep8Send";
import { Sep31Send } from "components/Sep31Send";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { useRedux } from "hooks/useRedux";
import { Asset } from "types/types";
import { ContractAccountInfo } from "../components/ContractAccountInfo";

export const Account = () => {
  const { account, contractAccount } = useRedux("account", "contractAccount");
  const [sendPaymentModalVisible, setSendPaymentModalVisible] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | undefined>();

  const dispatch = useDispatch();

  const handleCloseModal = () => {
    setSendPaymentModalVisible(false);
    dispatch(resetActiveAssetAction());
  };

  const handleSendPayment = (asset?: Asset) => {
    setCurrentAsset(asset);
    setSendPaymentModalVisible(true);
  };

  if (!account.data?.id && !contractAccount.data?.contract) {
    return null;
  }

  return (
    <>
      {/* Account */}
      <AccountInfo />

      {/* Contract Account Info */}
      <ContractAccountInfo />

      {/* Assets / Balances */}
      <Assets onSendPayment={handleSendPayment} />

      {/* SEP-6 Deposit */}
      <Sep6Deposit />

      {/* SEP-6 Withdraw */}
      <Sep6Withdraw />

      {/* SEP-8 Send */}
      <Sep8Send />

      {/* SEP-31 Send */}
      <Sep31Send />

      <Modal
        visible={Boolean(sendPaymentModalVisible)}
        onClose={handleCloseModal}
        parentId={CSS_MODAL_PARENT_ID}
      >
        {/* Send payment */}
        <SendPayment asset={currentAsset} onClose={handleCloseModal} />
      </Modal>
    </>
  );
};
