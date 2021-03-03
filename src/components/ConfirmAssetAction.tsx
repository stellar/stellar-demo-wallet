import { Button, ButtonVariant, Heading2 } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";

export const ConfirmAssetAction = ({ onClose }: { onClose: () => void }) => {
  const { activeAsset } = useRedux("activeAsset");

  if (!activeAsset?.asset) {
    return null;
  }

  const { title, description, callback, options } = activeAsset.asset;

  return (
    <>
      {/* TODO: move to Modal component */}
      <Heading2 className="ModalHeading">{title}</Heading2>

      <div className="ModalBody">
        {description && <p>{description}</p>}
        {options && <p>{options}</p>}
      </div>

      <div className="ModalButtonsFooter">
        <Button
          onClick={() => {
            callback();
          }}
        >
          Start
        </Button>
        <Button variant={ButtonVariant.secondary} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </>
  );
};
