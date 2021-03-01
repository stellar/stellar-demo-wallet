import { useState } from "react";
import { Types } from "@stellar/wallet-sdk";

import { AccountInfo } from "components/AccountInfo";
import { Assets } from "components/Assets";
import { Modal } from "components/Modal";
import { SendPayment } from "components/SendPayment";
import { Sep31Send } from "components/Sep31Send";
import { useRedux } from "hooks/useRedux";

export const Account = () => {
  const { account } = useRedux("account");
  const [sendPaymentModalVisible, setSendPaymentModalVisible] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<
    Types.AssetBalance | undefined
  >();

  const handleCloseModal = () => {
    setSendPaymentModalVisible(false);
  };

  const handleSendPayment = (asset?: Types.AssetBalance) => {
    setCurrentAsset(asset);
    setSendPaymentModalVisible(true);
  };

  if (!account.data?.id) {
    return null;
  }

  return (
    <div className="Inset">
      {/* Account */}
      <AccountInfo />

      {/* Assets / Balances */}
      <Assets onSendPayment={handleSendPayment} />

      {/* SEP-31 Send */}
      <Sep31Send />

      <Modal
        visible={Boolean(sendPaymentModalVisible)}
        onClose={handleCloseModal}
      >
        {/* Send payment */}
        <SendPayment asset={currentAsset} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};
