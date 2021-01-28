import React, { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Keypair } from "stellar-sdk";
import { fetchAccountAction } from "ducks/account";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { updateSettingsAction } from "ducks/settings";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const SettingsHandler = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { account } = useRedux("account");

  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const pubnetParam = queryParams.get("pubnet");
  const secretKeyParam = queryParams.get("secretKey");
  const untrustedAssetsParam = queryParams.get("untrustedAssets");

  // Set network param (pubnet=true)
  useEffect(() => {
    dispatch(updateSettingsAction({ pubnet: pubnetParam === "true" }));
  }, [pubnetParam, dispatch]);

  // Set secret key param (secretKey=[SECRET_KEY]) and fetch account info
  // This will handle both: secret key submitted on Demo Wallet and directly
  // from the URL
  useEffect(() => {
    dispatch(updateSettingsAction({ secretKey: secretKeyParam || "" }));

    // TODO: validate secret key
    if (secretKeyParam) {
      try {
        const keypair = Keypair.fromSecret(secretKeyParam);
        dispatch(
          fetchAccountAction({
            publicKey: keypair.publicKey(),
            secretKey: keypair.secret(),
          }),
        );

        dispatch(
          fetchClaimableBalancesAction({ publicKey: keypair.publicKey() }),
        );
      } catch (error) {
        // TODO: handle error
        console.log("Fetch account error: ", error.toString());
      }
    }
  }, [secretKeyParam, dispatch]);

  // Untrusted assets
  useEffect(() => {
    dispatch(
      updateSettingsAction({ untrustedAssets: untrustedAssetsParam || "" }),
    );
  }, [untrustedAssetsParam, dispatch]);

  // Go to /account page if fetching account was success
  useEffect(() => {
    if (account.status === ActionStatus.SUCCESS) {
      history.push({
        pathname: "/account",
        search: history.location.search,
      });
    }
  }, [account.status, history]);

  return <>{children}</>;
};
