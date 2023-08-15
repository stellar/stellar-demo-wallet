import { useDispatch } from "react-redux";
import { Sep8ActionRequiredForm } from "components/Sep8Send/Sep8ActionRequiredForm";
import { Sep8Approval } from "components/Sep8Send/Sep8Approval";
import { Sep8Review } from "components/Sep8Send/Sep8Review";
import { resetActiveAssetAction } from "ducks/activeAsset";
import { resetSep8SendAction } from "ducks/sep8Send";
import { useRedux } from "hooks/useRedux";
import { Sep8Step } from "types/types";

export const Sep8Send = () => {
  const { sep8Send } = useRedux("sep8Send");
  const sep8Step = sep8Send.data.sep8Step;
  const dispatch = useDispatch();

  const onClose = () => {
    dispatch(resetActiveAssetAction());
    dispatch(resetSep8SendAction());
  };

  return (
    <>
      {[Sep8Step.STARTING, Sep8Step.PENDING].includes(sep8Step) && (
        <Sep8Approval onClose={onClose} />
      )}

      {[Sep8Step.TRANSACTION_REVISED, Sep8Step.COMPLETE].includes(sep8Step) && (
        <Sep8Review onClose={onClose} />
      )}

      {[
        Sep8Step.ACTION_REQUIRED,
        Sep8Step.SENT_ACTION_REQUIRED_FIELDS,
      ].includes(sep8Step) && <Sep8ActionRequiredForm onClose={onClose} />}
    </>
  );
};
