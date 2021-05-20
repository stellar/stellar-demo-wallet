import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Sep8Approval } from "components/Sep8Send/Sep8Approval";
import { Sep8Review } from "components/Sep8Send/Sep8Review";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { resetSep8SendAction } from "ducks/sep8Send";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep8Send = () => {
  const { sep8Send } = useRedux("sep8Send");
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const dispatch = useDispatch();

  const onClose = () => {
    setApprovalModalVisible(false);
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  };

  // use effect
  useEffect(() => {
    if (!sep8Send.status) {
      setReviewModalVisible(false);
      setApprovalModalVisible(false);
      return;
    }

    if (sep8Send.status !== ActionStatus.CAN_PROCEED) {
      return;
    }

    const hasTxToRevise = Boolean(
      sep8Send.data.revisedTransaction.revisedTxXdr,
    );
    setApprovalModalVisible(!hasTxToRevise);
    setReviewModalVisible(hasTxToRevise);
  }, [sep8Send.status, sep8Send.data.revisedTransaction.revisedTxXdr]);

  return (
    <>
      {approvalModalVisible && <Sep8Approval onClose={onClose} />}

      {reviewModalVisible && <Sep8Review onClose={onClose} />}
    </>
  );
};
