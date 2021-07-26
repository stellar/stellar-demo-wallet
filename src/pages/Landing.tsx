import { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Heading1, Loader, TextLink } from "@stellar/design-system";
import { metrics } from "@stellar/frontend-helpers";

import { METRIC_NAMES } from "constants/metricNames";
import { createRandomAccount } from "ducks/account";
import { ConnectAccount } from "components/ConnectAccount";
import { Modal } from "components/Modal";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";

export const Landing = () => {
  const { account } = useRedux("account");
  const [isConnectAccountModalVisible, setIsConnectAccountModalVisible] =
    useState(false);

  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    metrics.emitMetric(METRIC_NAMES.viewHome);
  }, []);

  useEffect(() => {
    if (account.status === ActionStatus.SUCCESS && !account.isAuthenticated) {
      history.push(
        searchParam.update(SearchParams.SECRET_KEY, account.secretKey),
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
    history.push(searchParam.update(SearchParams.PUBNET, "false"));
    dispatch(createRandomAccount());
  };

  return (
    <div className="Inset">
      <Heading1>Import or generate keypair</Heading1>

      <div className="LandingButtons">
        <TextLink
          role="button"
          onClick={() => setIsConnectAccountModalVisible(true)}
          variant={TextLink.variant.secondary}
          disabled={account.status === ActionStatus.PENDING}
        >
          Provide a secret key (testnet or mainnet)
        </TextLink>

        <div className="Inline">
          <TextLink
            role="button"
            onClick={handleCreateAccount}
            variant={TextLink.variant.secondary}
            disabled={account.status === ActionStatus.PENDING}
          >
            Generate keypair for new account (testnet only)
          </TextLink>

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
