import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Heading1,
  TextButton,
  TextButtonVariant,
} from "@stellar/design-system";

import { createRandomAccountAndFundIt } from "ducks/account";
import { LoadAccount } from "components/LoadAccount";
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
    history.push(
      getNetworkSearchParam({
        location,
        pubnet: false,
      }),
    );
    // TODO: handle loading state
    // TODO: don't pre-fund the account
    dispatch(createRandomAccountAndFundIt());
  };

  return (
    <div className="Inset">
      <Heading1>Load or create an account</Heading1>

      <div className="LandingButtons">
        <TextButton
          onClick={() => setIsConnectAccountModalVisible(true)}
          variant={TextButtonVariant.secondary}
        >
          Connect a Stellar account (testnet or mainnet)
        </TextButton>

        <TextButton
          onClick={handleCreateAccount}
          variant={TextButtonVariant.secondary}
        >
          Generate keypair for new account (testnet only)
        </TextButton>
      </div>

      <Modal
        visible={isConnectAccountModalVisible}
        onClose={() => setIsConnectAccountModalVisible(false)}
      >
        <LoadAccount />
      </Modal>
    </div>
  );
};
