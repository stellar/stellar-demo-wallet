import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Heading2, Loader } from "@stellar/design-system";
import { TextButton } from "components/TextButton";
import { TextLink } from "components/TextLink";
import ReactJson from "react-json-view";

import { CopyWithText } from "components/CopyWithText";
import { ToastBanner } from "components/ToastBanner";

import { fetchAccountAction, fundTestnetAccount } from "ducks/account";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";

import { shortenStellarKey } from "helpers/shortenStellarKey";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const AccountInfo = () => {
  const { account } = useRedux("account");
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);

  const dispatch = useDispatch();

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

  return (
    <div className="Inset">
      <div className="Account">
        {/* Account keys */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Public</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.data.id)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyWithText textToCopy={account.data.id} />
            </div>
          </div>
          <div className="AccountInfoRow">
            <div className="AccountInfoCell AccountLabel">Secret</div>
            <div className="AccountInfoCell">
              {shortenStellarKey(account.secretKey)}
            </div>
            <div className="AccountInfoCell CopyButton">
              <CopyWithText textToCopy={account.secretKey} />
            </div>
          </div>
        </div>

        {/* Account actions */}
        <div className="AccountInfo">
          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              {account.isUnfunded && (
                <div className="InfoButtonWrapper">
                  <TextButton
                    onClick={handleCreateAccount}
                    disabled={account.status === ActionStatus.PENDING}
                    tooltipText={
                      <>
                        Clicking create will fund your test account with XLM. If
                        you’re testing SEP-24 you may want to leave this account
                        unfunded.{" "}
                        <TextLink
                          href="https://developers.stellar.org/docs/tutorials/create-account/#create-account"
                          isExternal
                        >
                          Learn more
                        </TextLink>
                      </>
                    }
                  >
                    Create account
                  </TextButton>
                </div>
              )}

              {!account.isUnfunded && (
                <TextButton
                  onClick={() =>
                    setIsAccountDetailsVisible(!isAccountDetailsVisible)
                  }
                >{`${
                  isAccountDetailsVisible ? "Hide" : "Show"
                } account details`}</TextButton>
              )}
            </div>
          </div>

          <div className="AccountInfoRow">
            <div className="AccountInfoCell">
              <div className="InfoButtonWrapper">
                <TextButton
                  onClick={handleRefreshAccount}
                  disabled={account.status === ActionStatus.PENDING}
                  tooltipText="If you performed account actions elsewhere, like in the
                  Stellar Laboratory, click here to update."
                >
                  Refresh account
                </TextButton>
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
            <ReactJson
              src={account.data}
              collapseStringsAfterLength={15}
              displayDataTypes={false}
              collapsed={1}
              theme={{
                base00: "#fff",
                base01: "#fff",
                base02: "#fff",
                base03: "#000",
                base04: "#3e1bdb",
                base05: "#000",
                base06: "#000",
                base07: "#000",
                base08: "#000",
                base09: "#000",
                base0A: "#000",
                base0B: "#000",
                base0C: "#000",
                base0D: "#3e1bdb",
                base0E: "#3e1bdb",
                base0F: "#3e1bdb",
              }}
            />
          </div>
        </div>
      )}

      <ToastBanner
        parentId="app-wrapper"
        visible={account.status === ActionStatus.PENDING}
      >
        <div className="Inline">
          <span>Updating account</span>
          <Loader />
        </div>
      </ToastBanner>
    </div>
  );
};
