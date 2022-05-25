import { Button, Modal } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";
import { CustodialFields } from "components/CustodialFields";

export const ConfirmAssetAction = ({ onClose }: { onClose: () => void }) => {
  const { activeAsset } = useRedux("activeAsset");

  if (!activeAsset?.action) {
    return null;
  }

  const { title, description, callback, options, showCustodial } =
    activeAsset.action;

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
        {options ? <p>{options}</p> : null}
        {showCustodial ? <CustodialFields /> : null}
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
