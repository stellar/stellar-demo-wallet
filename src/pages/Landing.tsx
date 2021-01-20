import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";

import { createRandomAccountAndFundIt } from "ducks/account";
import { LoadAccount } from "components/LoadAccount";
import { getNetworkSearchParam } from "helpers/getNetworkSearchParam";
import { getSecretKeySearchParam } from "helpers/getSecretKeySearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Landing = () => {
  const { settings, account } = useRedux("settings", "account");
  const [isLoadAccountVisible, setIsLoadAccountVisible] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    if (account.status === ActionStatus.SUCCESS && !account.isAuthenticated) {
      history.push(
        getSecretKeySearchParam({
          location,
          secretKey: account.secretKey,
        }),
      );
    }
  }, [
    account.secretKey,
    account.status,
    account.isAuthenticated,
    history,
    location,
  ]);

  const handleCreateAccount = () => {
    // TODO: handle loading state
    dispatch(createRandomAccountAndFundIt());
  };

  const handleLoadAccount = () => {
    setIsLoadAccountVisible(!isLoadAccountVisible);
  };

  const handleSwitchNetwork = () => {
    history.push(
      getNetworkSearchParam({
        location,
        pubnet: !settings.pubnet,
      }),
    );
  };

  return (
    <div className="Inset">
      <div className="Block">
        {!settings.pubnet && (
          <TextButton onClick={handleCreateAccount}>Create Account</TextButton>
        )}
        <TextButton onClick={handleLoadAccount}>Load Account</TextButton>
        {isLoadAccountVisible && <LoadAccount />}
        <TextButton onClick={handleSwitchNetwork}>{`Use ${
          settings.pubnet ? "Testnet" : "Pubnet"
        }`}</TextButton>
      </div>
    </div>
  );
};
