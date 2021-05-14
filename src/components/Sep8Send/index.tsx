import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Sep8Approve } from "components/Sep8Send/Sep8Approve";
import { Sep8Review } from "components/Sep8Send/Sep8Review";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { resetSep8SendAction } from "ducks/sep8Send";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8Send = () => {
  const { sep8Send } = useRedux("sep8Send");
  const [sep8ApprovalModalVisible, setSep8ApprovalModalVisible] = useState(
    false,
  );
  const [sep8ReviewModalVisible, setSep8ReviewModalVisible] = useState(false);
  const dispatch = useDispatch();

  const onClose = () => {
    setSep8ApprovalModalVisible(false);
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  };

  // use effect
  useEffect(() => {
    if (!sep8Send.status) {
      setSep8ReviewModalVisible(false);
      setSep8ApprovalModalVisible(false);
      return;
    }

    if (sep8Send.status !== ActionStatus.CAN_PROCEED) {
      return;
    }

    const hasTxToRevise = Boolean(sep8Send.data.reviseTransaction.revisedTxXdr);
    setSep8ApprovalModalVisible(!hasTxToRevise);
    setSep8ReviewModalVisible(hasTxToRevise);
  }, [sep8Send.status, sep8Send.data.reviseTransaction.revisedTxXdr]);

  if (sep8ApprovalModalVisible) {
    return <Sep8Approve onClose={onClose} />;
  }
  if (sep8ReviewModalVisible) {
    return <Sep8Review onClose={onClose} />;
  }

  return null;
};
