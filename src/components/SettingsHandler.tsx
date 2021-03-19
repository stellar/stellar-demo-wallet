import React, { useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Keypair } from "stellar-sdk";
import { fetchAccountAction } from "ducks/account";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { updateSettingsAction } from "ducks/settings";
import { getErrorMessage } from "helpers/getErrorMessage";
import { log } from "helpers/log";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";

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
  const pubnetParam = queryParams.get(SearchParams.PUBNET);
  const secretKeyParam = queryParams.get(SearchParams.SECRET_KEY);
  const untrustedAssetsParam = queryParams.get(SearchParams.UNTRUSTED_ASSETS);
  const assetOverridesParam = queryParams.get(SearchParams.ASSET_OVERRIDES);

  // Set network param (pubnet=true)
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.PUBNET]: pubnetParam === "true",
      }),
    );
  }, [pubnetParam, dispatch]);

  // Set secret key param (secretKey=[SECRET_KEY]) and fetch account info
  // This will handle both: secret key submitted on Demo Wallet and directly
  // from the URL
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.SECRET_KEY]: secretKeyParam || "",
      }),
    );

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
        log.error({
          title: "Fetch account error",
          body: getErrorMessage(error),
        });
      }
    }
  }, [secretKeyParam, dispatch]);

  // Untrusted assets
  useEffect(() => {
    const cleanedAssets = untrustedAssetsParam
      ?.split(",")
      .reduce(
        (unique: string[], item: string) =>
          unique.includes(item) ? unique : [...unique, item],
        [],
      )
      .join(",");

    dispatch(
      updateSettingsAction({
        [SearchParams.UNTRUSTED_ASSETS]: cleanedAssets || "",
      }),
    );
  }, [untrustedAssetsParam, dispatch]);

  // Asset overrides
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.ASSET_OVERRIDES]: assetOverridesParam || "",
      }),
    );
  }, [assetOverridesParam, dispatch]);

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
