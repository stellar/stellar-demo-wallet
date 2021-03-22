import { useState } from "react";
import { Heading2, Loader, Button } from "@stellar/design-system";
import { Toggle } from "components/Toggle";

export const ConfigurationModal = ({ onClose }: { onClose: () => void }) => {
  const [isPending] = useState();

  return (
    <>
      <Heading2 className="ModalHeading">Configuration</Heading2>

      <div className="ModalBody">
        <Toggle id="test" />
      </div>

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button onClick={onClose} disabled={isPending}>
          Close
        </Button>
      </div>
    </>
  );
};
