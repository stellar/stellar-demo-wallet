import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Keypair } from "@stellar/stellar-sdk";
import { fetchAccountAction } from "ducks/account";
import { fetchClaimableBalancesAction } from "ducks/claimableBalances";
import { updateSettingsAction } from "ducks/settings";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { log } from "demo-wallet-shared/build/helpers/log";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus, SearchParams } from "types/types";
import { fetchContractAccountAction } from "../ducks/contractAccount";
import {
  fetchContractAssetsAction,
} from "../ducks/contractAssets";

export const SettingsHandler = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { account, contractAccount } = useRedux("account", "contractAccount");
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const secretKeyParam = queryParams.get(SearchParams.SECRET_KEY);
  const untrustedAssetsParam = queryParams.get(SearchParams.UNTRUSTED_ASSETS);
  const assetOverridesParam = queryParams.get(SearchParams.ASSET_OVERRIDES);
  const contractAssetsParam = queryParams.get(SearchParams.CONTRACT_ASSETS);
  const claimableBalanceSupportedParam = queryParams.get(
    SearchParams.CLAIMABLE_BALANCE_SUPPORTED,
  );
  const contractIdParam = queryParams.get(SearchParams.CONTRACT_ID);

  // Asset overrides
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.ASSET_OVERRIDES]: assetOverridesParam || "",
      }),
    );
  }, [assetOverridesParam, dispatch]);

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

  // Claimabable balance supported
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.CLAIMABLE_BALANCE_SUPPORTED]:
          claimableBalanceSupportedParam === "true",
      }),
    );
  }, [claimableBalanceSupportedParam, dispatch]);

  // Go to /account page if fetching account was success
  useEffect(() => {
    if ((account.status === ActionStatus.SUCCESS && account.isAuthenticated) ||
      (contractAccount.status === ActionStatus.SUCCESS && contractAccount.isAuthenticated)) {
      navigate({
        pathname: "/account",
        search: location.search,
      });
    }
  }, [account.status, location.search, account.isAuthenticated, navigate, contractAccount.status, contractAccount.isAuthenticated]);

  // Handle contract ID from URL
  useEffect(() => {
    dispatch(
      updateSettingsAction({
        [SearchParams.CONTRACT_ID]: contractIdParam || "",
      }),
    );
    if (contractIdParam) {
      try {
        dispatch(fetchContractAccountAction(contractIdParam));
      } catch (error) {
        log.error({
          title: "Fetch contract account error",
          body: getErrorMessage(error),
        });
      }
    }
  }, [contractIdParam, dispatch]);

  // Handle contract assets from URL
  useEffect(() => {
    if (contractIdParam && contractAssetsParam) {
      try {
        dispatch(
          fetchContractAssetsAction({
            assetsString: contractAssetsParam,
            contractId: contractIdParam,
          }),
        );
      } catch (error) {
        log.error({
          title: "Fetch contract assets error",
          body: getErrorMessage(error),
        });
      }
    }
  }, [contractAssetsParam, contractIdParam, dispatch]);

  return <>{children}</>;
};
