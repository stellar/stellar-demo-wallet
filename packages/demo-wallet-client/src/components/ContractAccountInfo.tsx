import { useState } from "react";
import {
  Heading2,
  TextLink,
  Layout,
  CopyText,
} from "@stellar/design-system";

import { Json } from "components/Json";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";
import { ActionStatus } from "../types/types";
import { useDispatch } from "react-redux";
import {
  fetchContractAccountAction,
} from "../ducks/contractAccount";
import { AppDispatch } from "../config/store";
import { useRedux } from "../hooks/useRedux";
import { fetchContractAssetsAction } from "../ducks/contractAssets";

export const ContractAccountInfo = () => {
  const { contractAccount, settings } = useRedux("contractAccount", "settings")
  const [isContractDetailsVisible, setIsContractDetailsVisible] = useState(false);

  const dispatch: AppDispatch = useDispatch();
  const contractId = contractAccount.data?.contract;
  if (!contractId) {
    return null;
  }

  const handleRefreshAccount = () => {
    if (contractAccount.status !== ActionStatus.PENDING) {
      dispatch(fetchContractAssetsAction({
        assetsString: settings.contractAssets,
        contractId: contractId,
        assetOverridesString: settings.assetOverrides || undefined,
      }))
      dispatch(fetchContractAccountAction(contractId));
    }
  };

  return (
    <Layout.Inset>
      <div className="Account">
        {/* Contract keys */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Contract ID</div>
            <div className="AccountInfoCell ContractIdCell">
              {shortenStellarKey(contractId)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyText textToCopy={contractId}>
                <TextLink>Copy</TextLink>
              </CopyText>
            </div>
          </div>
          {/* TODO(jiahuihu): Replace key id with something more meaningful  */}
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Key ID</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(contractAccount.keyId)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyText textToCopy={contractAccount.keyId}>
                <TextLink>Copy</TextLink>
              </CopyText>
            </div>
          </div>
        </div>

        {/* Contract actions */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              <TextLink
                onClick={() =>
                  setIsContractDetailsVisible(!isContractDetailsVisible)
                }
              >{`${
                isContractDetailsVisible ? "Hide" : "Show"
              } contract details`}</TextLink>
            </div>
          </div>

          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              <div className="InfoButtonWrapper">
                <TextLink
                  onClick={handleRefreshAccount}
                  disabled={contractAccount.status === ActionStatus.PENDING}>
                  Refresh account
                </TextLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract details */}
      {isContractDetailsVisible && contractAccount.data && (
        <div className="AccountDetails Section">
          <Heading2>Contract details</Heading2>
          <div className="AccountDetailsContent">
            <Json src={contractAccount.data} />
          </div>
        </div>
      )}
    </Layout.Inset>
  );
};
