import { Button, Modal } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";

export const ConfirmAssetAction = ({ onClose }: { onClose: () => void }) => {
  const { activeAsset } = useRedux("activeAsset");

  if (!activeAsset?.action) {
    return null;
  }

  const { title, description, callback, options } = activeAsset.action;

  return (
    <>
      <Modal.Heading>{title}</Modal.Heading>

      <Modal.Body>
        {description &&
          (typeof description === "string" ? (
            <p>{description}</p>
          ) : (
            description
          ))}
        {options && <p>{options}</p>}
      </Modal.Body>

      <Modal.Footer>
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
      </Modal.Footer>
    </>
  );
};
