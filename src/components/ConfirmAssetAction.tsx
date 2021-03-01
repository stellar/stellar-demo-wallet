import { Button, ButtonVariant, Heading2 } from "@stellar/design-system";
import { ActiveAsset } from "types/types.d";

export const ConfirmAssetAction = ({
  activeItem,
  onClose,
}: {
  activeItem: ActiveAsset;
  onClose: () => void;
}) => {
  const { title, description, callback, options } = activeItem;

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
