import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Heading1,
  Loader,
  TextButton,
  TextButtonVariant,
} from "@stellar/design-system";

import { createRandomAccount } from "ducks/account";
import { ConnectAccount } from "components/ConnectAccount";
import { Modal } from "components/Modal";
import { getNetworkSearchParam } from "helpers/getNetworkSearchParam";
import { getSecretKeySearchParam } from "helpers/getSecretKeySearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Landing = () => {
  const { account } = useRedux("account");
  const [
    isConnectAccountModalVisible,
    setIsConnectAccountModalVisible,
  ] = useState(false);

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
    // Make sure we are on testnet
    history.push(
      getNetworkSearchParam({
        location,
        pubnet: false,
      }),
    );
    dispatch(createRandomAccount());
  };

  return (
    <div className="Inset">
      <Heading1>Load or create an account</Heading1>

      <div className="LandingButtons">
        <TextButton
          onClick={() => setIsConnectAccountModalVisible(true)}
          variant={TextButtonVariant.secondary}
          disabled={account.status === ActionStatus.PENDING}
        >
          Connect a Stellar account (testnet or mainnet)
        </TextButton>

        <div className="Inline">
          <TextButton
            onClick={handleCreateAccount}
            variant={TextButtonVariant.secondary}
            disabled={account.status === ActionStatus.PENDING}
          >
            Generate keypair for new account (testnet only)
          </TextButton>

          {!isConnectAccountModalVisible &&
            account.status === ActionStatus.PENDING && <Loader />}
        </div>
      </div>

      <Modal
        visible={isConnectAccountModalVisible}
        onClose={() => setIsConnectAccountModalVisible(false)}
      >
        <ConnectAccount />
      </Modal>
    </div>
  );
};
