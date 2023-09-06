import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Heading2,
  Loader,
  TextLink,
  Layout,
  CopyText,
  DetailsTooltip,
} from "@stellar/design-system";

import { Json } from "components/Json";
import { ToastBanner } from "components/ToastBanner";

import { fetchAccountAction, fundTestnetAccount } from "ducks/account";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";

import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus } from "types/types";

export const AccountInfo = () => {
  const { account } = useRedux("account");
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);

  const dispatch: AppDispatch = useDispatch();

  const handleRefreshAccount = useCallback(() => {
    if (account.data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: account.data.id,
          secretKey: account.secretKey,
        }),
      );
      dispatch(fetchClaimableBalancesAction({ publicKey: account.data.id }));
    }
  }, [account.data?.id, account.secretKey, dispatch]);

  const handleCreateAccount = () => {
    if (account.data?.id) {
      dispatch(fundTestnetAccount(account.data.id));
    }
  };

  if (!account.data?.id) {
    return null;
  }

  const isPending = account.status === ActionStatus.PENDING;

  return (
    <Layout.Inset>
      <div className="Account">
        {/* Account keys */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Public</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.data.id)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyText textToCopy={account.data.id}>
                <TextLink>Copy</TextLink>
              </CopyText>
            </div>
          </div>
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Secret</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.secretKey)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyText textToCopy={account.secretKey}>
                <TextLink>Copy</TextLink>
              </CopyText>
            </div>
          </div>
        </div>

        {/* Account actions */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              {account.isUnfunded && (
                <div className="InfoButtonWrapper">
                  <DetailsTooltip
                    details={
                      <>
                        Clicking create will fund your test account with XLM. If
                        you’re testing SEP-24 you may want to leave this account
                        unfunded.{" "}
                        <TextLink href="https://developers.stellar.org/docs/tutorials/create-account/#create-account">
                          Learn more
                        </TextLink>
                      </>
                    }
                  >
                    <TextLink
                      onClick={handleCreateAccount}
                      disabled={isPending}
                    >
                      Create account
                    </TextLink>
                  </DetailsTooltip>
                </div>
              )}

              {!account.isUnfunded && (
                <TextLink
                  onClick={() =>
                    setIsAccountDetailsVisible(!isAccountDetailsVisible)
                  }
                >{`${
                  isAccountDetailsVisible ? "Hide" : "Show"
                } account details`}</TextLink>
              )}
            </div>
          </div>

          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              <div className="InfoButtonWrapper">
                <DetailsTooltip
                  details="If you performed account actions elsewhere, like in the
                  Stellar Laboratory, click here to update."
                >
                  <TextLink onClick={handleRefreshAccount} disabled={isPending}>
                    Refresh account
                  </TextLink>
                </DetailsTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      {isAccountDetailsVisible && (
        <div className="AccountDetails Section">
          <Heading2>Account details</Heading2>
          <div className="AccountDetailsContent">
            <Json src={account.data} />
          </div>
        </div>
      )}

      <ToastBanner parentId="app-wrapper" visible={isPending}>
        <div className="Layout__inline">
          <span>Updating account</span>
          <Loader />
        </div>
      </ToastBanner>
    </Layout.Inset>
  );
};
