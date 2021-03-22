import { useHistory } from "react-router-dom";
import { Heading2, Button } from "@stellar/design-system";
import { Toggle } from "components/Toggle";
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
      <Heading2 className="ModalHeading">Configuration</Heading2>

      <div className="ModalBody">
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
      </div>

      <div className="ModalButtonsFooter">
        <Button onClick={onClose}>Close</Button>
      </div>
    </>
  );
};
