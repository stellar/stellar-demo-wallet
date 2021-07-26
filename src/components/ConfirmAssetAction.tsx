import { Button, Heading2 } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";

export const ConfirmAssetAction = ({ onClose }: { onClose: () => void }) => {
  const { activeAsset } = useRedux("activeAsset");

  if (!activeAsset?.action) {
    return null;
  }

  const { title, description, callback, options } = activeAsset.action;

  return (
    <>
      {/* TODO: move to Modal component */}
      <Heading2 className="ModalHeading">{title}</Heading2>

      <div className="ModalBody">
        {description &&
          (typeof description === "string" ? (
            <p>{description}</p>
          ) : (
            description
          ))}
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
        <Button variant={Button.variant.secondary} onClick={onClose}>
          Cancel
        </Button>
      </div>
    </>
  );
};
