import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Sep8ActionRequiredForm } from "components/Sep8Send/Sep8ActionRequiredForm";
import { Sep8Approval } from "components/Sep8Send/Sep8Approval";
import { Sep8Review } from "components/Sep8Send/Sep8Review";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { resetSep8SendAction } from "ducks/sep8Send";
import { useRedux } from "hooks/useRedux";
import { Sep8Step } from "types/types.d";

export const Sep8Send = () => {
  const { sep8Send } = useRedux("sep8Send");
  const dispatch = useDispatch();

  const onClose = useCallback(() => {
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  }, [dispatch]);

  return (
    <>
      {(sep8Send.data.sep8Step === Sep8Step.STARTING ||
        sep8Send.data.sep8Step === Sep8Step.PENDING) && (
        <Sep8Approval onClose={onClose} />
      )}

      {(sep8Send.data.sep8Step === Sep8Step.TRANSACTION_REVISED ||
        sep8Send.data.sep8Step === Sep8Step.COMPLETE) && (
        <Sep8Review onClose={onClose} />
      )}

      {(sep8Send.data.sep8Step === Sep8Step.ACTION_REQUIRED ||
        sep8Send.data.sep8Step === Sep8Step.SENT_ACTION_REQUIRED_PARAMS) && (
        <Sep8ActionRequiredForm onClose={onClose} />
      )}
    </>
  );
};
