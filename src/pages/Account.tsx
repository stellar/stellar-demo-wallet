import { useState } from "react";
import { useDispatch } from "react-redux";
import { AccountInfo } from "components/AccountInfo";
import { Assets } from "components/Assets";
import { Modal } from "components/Modal";
import { SendPayment } from "components/SendPayment";
import { Sep8Send } from "components/Sep8Send";
import { Sep31Send } from "components/Sep31Send";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { useRedux } from "hooks/useRedux";
import { Asset } from "types/types.d";

export const Account = () => {
  const { account } = useRedux("account");
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

  if (!account.data?.id) {
    return null;
  }

  return (
    <>
      {/* Account */}
      <AccountInfo />

      {/* Assets / Balances */}
      <Assets onSendPayment={handleSendPayment} />

      {/* SEP-8 Send */}
      <Sep8Send />

      {/* SEP-31 Send */}
      <Sep31Send />

      <Modal
        visible={Boolean(sendPaymentModalVisible)}
        onClose={handleCloseModal}
      >
        {/* Send payment */}
        <SendPayment asset={currentAsset} onClose={handleCloseModal} />
      </Modal>
    </>
  );
};
