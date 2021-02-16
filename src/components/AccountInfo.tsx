import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Loader, TextButton, TextLink } from "@stellar/design-system";

import { CopyWithText } from "components/CopyWithText";
import { InfoButtonWithTooltip } from "components/InfoButtonWithTooltip";

import { fetchAccountAction, fundTestnetAccount } from "ducks/account";

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
    <>
      {account.status === ActionStatus.PENDING && (
        <div className="Inline LoadingBlock">
          <span>Updating account</span>
          <Loader />
        </div>
      )}

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
                  >
                    Create account
                  </TextButton>

                  {/* TODO: add link */}
                  <InfoButtonWithTooltip>
                    Clicking create will fund your test account with XLM. If
                    you’re testing SEP-24 you may want to leave this account
                    unfunded.{" "}
                    <TextLink href="#" target="_blank" rel="noreferrer">
                      Learn more
                    </TextLink>
                  </InfoButtonWithTooltip>
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
                >
                  Refresh account
                </TextButton>

                <InfoButtonWithTooltip>
                  If you performed account actions elsewhere, like in the
                  Stellar Laboratory, click here to update.
                </InfoButtonWithTooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TODO: needs styling */}
      {/* Account details */}
      {isAccountDetailsVisible && (
        <div>
          <pre>{JSON.stringify(account.data, null, 2)}</pre>
        </div>
      )}
    </>
  );
};
