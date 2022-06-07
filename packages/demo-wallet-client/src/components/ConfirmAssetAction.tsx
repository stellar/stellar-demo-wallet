import { useState } from "react";
import { Button, Modal } from "@stellar/design-system";
import { useRedux } from "hooks/useRedux";
import { CustodialFields } from "components/CustodialFields";
import { Sep9Fields } from "components/Sep9Fields";

export const ConfirmAssetAction = ({ onClose }: { onClose: () => void }) => {
  const { activeAsset } = useRedux("activeAsset");
  const [isCustodialFieldsValid, setIsCustodialFieldsValid] = useState(true);

  if (!activeAsset?.action) {
    return null;
  }

  const { title, description, callback, options, showCustodial, showExtra } =
    activeAsset.action;

  const isStartDisabled = showCustodial && !isCustodialFieldsValid;

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
        {showCustodial ? (
          <CustodialFields
            isValid={(isValid: boolean) => setIsCustodialFieldsValid(isValid)}
          />
        ) : null}

        {showExtra ? <Sep9Fields /> : null}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={() => {
            callback();
          }}
          disabled={isStartDisabled}
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
