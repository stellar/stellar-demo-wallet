import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Heading3,
  Loader,
  TextLink,
  Modal,
  Layout,
} from "@stellar/design-system";
import { metrics } from "@stellar/frontend-helpers";

import { METRIC_NAMES } from "demo-wallet-shared/build/constants/metricNames";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { createRandomAccount } from "ducks/account";
import { ConnectAccount } from "components/ConnectAccount";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";

export const Landing = () => {
  const { account } = useRedux("account");
  const [isConnectAccountModalVisible, setIsConnectAccountModalVisible] =
    useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    metrics.emitMetric(METRIC_NAMES.viewHome);
  }, []);

  useEffect(() => {
    if (account.status === ActionStatus.SUCCESS && !account.isAuthenticated) {
      navigate(searchParam.update(SearchParams.SECRET_KEY, account.secretKey));
    }
  }, [account.secretKey, account.status, account.isAuthenticated, navigate]);

  const handleCreateAccount = () => {
    // Make sure we are on testnet
    navigate(searchParam.update(SearchParams.PUBNET, "false"));
    dispatch(createRandomAccount());
  };

  const isPending = account.status === ActionStatus.PENDING;

  return (
    <Layout.Inset>
      <div className="Landing__container">
        <Heading3>Import or generate keypair</Heading3>

        <div className="Landing__buttons">
          <TextLink
            onClick={() => setIsConnectAccountModalVisible(true)}
            variant={TextLink.variant.secondary}
            disabled={isPending}
            underline
          >
            Provide a secret key (testnet or mainnet)
          </TextLink>

          <div className="Layout__inline">
            <TextLink
              onClick={handleCreateAccount}
              variant={TextLink.variant.secondary}
              disabled={isPending}
              underline
            >
              Generate keypair for new account (testnet only)
            </TextLink>

            {!isConnectAccountModalVisible && isPending && <Loader />}
          </div>
        </div>

        <Modal
          visible={isConnectAccountModalVisible}
          onClose={() => setIsConnectAccountModalVisible(false)}
          parentId={CSS_MODAL_PARENT_ID}
        >
          <ConnectAccount />
        </Modal>
      </div>
    </Layout.Inset>
  );
};
