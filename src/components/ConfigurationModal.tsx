import { useState } from "react";
import { Heading2, Loader, Button } from "@stellar/design-system";
import { Toggle } from "components/Toggle";

export const ConfigurationModal = ({ onClose }: { onClose: () => void }) => {
  const [isPending] = useState();
  const [claimableBalanceSupported, setClaimableBalanceSupported] = useState(
    false,
  );

  const handleClaimableBalanceSupported = () => {
    setClaimableBalanceSupported(!claimableBalanceSupported);
    // TODO: save in store
  };

  return (
    <>
      <Heading2 className="ModalHeading">Configuration</Heading2>

      <div className="ModalBody">
        <div className="ConfigurationItem">
          <label htmlFor="claimable-balance-supported">
            Claimable balance supported
          </label>
          <Toggle
            id="claimable-balance-supported"
            checked={claimableBalanceSupported}
            onChange={handleClaimableBalanceSupported}
          />
        </div>
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
