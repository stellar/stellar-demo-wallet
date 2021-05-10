import { useEffect, useState } from "react";
import { useRedux } from "hooks/useRedux";
import { Modal } from "components/Modal";
import { ActionStatus } from "types/types.d";
import { useDispatch } from "react-redux";
import { resetSep8SendAction } from "ducks/sep8Send";
import { resetActiveAssetAction } from "ducks/activeAsset";

export const Sep8Send = () => {
  const { sep8Send } = useRedux("sep8Send");
  const [sep8PaymentModalVisible, setSep8PaymentModalVisible] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (sep8Send.status === ActionStatus.CAN_PROCEED) {
      setSep8PaymentModalVisible(true);
    }
  }, [sep8Send]);

  const handleCloseModal = () => {
    setSep8PaymentModalVisible(false);
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  };

  return (
    <Modal visible={sep8PaymentModalVisible} onClose={handleCloseModal}>
      {/* Send payment */}
      <p>Foo bar</p>
      <p>{JSON.stringify(sep8Send.data)}</p>
    </Modal>
  );
};
