import { useHistory } from "react-router-dom";
import { Button, Modal, Toggle } from "@stellar/design-system";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { SearchParams } from "types/types.d";

export const ConfigurationModal = ({ onClose }: { onClose: () => void }) => {
  const { settings } = useRedux("settings");
  const history = useHistory();

  const handleClaimableBalanceSupported = () => {
    history.push(
      searchParam.update(
        SearchParams.CLAIMABLE_BALANCE_SUPPORTED,
        (!settings.claimableBalanceSupported).toString(),
      ),
    );
  };

  return (
    <>
      <Modal.Heading>Configuration</Modal.Heading>

      <Modal.Body>
        <div className="ConfigurationItem">
          <label htmlFor="claimable-balance-supported">
            Claimable balance supported
          </label>
          <Toggle
            id="claimable-balance-supported"
            checked={settings.claimableBalanceSupported}
            onChange={handleClaimableBalanceSupported}
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onClose}>Close</Button>
      </Modal.Footer>
    </>
  );
};
