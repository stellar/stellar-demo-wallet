import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Heading2, Input, Loader } from "@stellar/design-system";
import { getUntrustedAssetsSearchParam } from "helpers/getUntrustedAssetsSearchParam";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { log } from "helpers/log";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const AddAsset = () => {
  const { account, untrustedAssets } = useRedux("account", "untrustedAssets");

  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [localStatus, setLocalStatus] = useState<ActionStatus | undefined>();

  const history = useHistory();

  const resetState = () => {
    setAssetCode("");
    setHomeDomain("");
    setAssetIssuer("");
    setErrorMessage("");
    setSuccessMessage("");
    setLocalStatus(undefined);
  };

  useEffect(() => () => resetState(), []);

  useEffect(() => {
    if (
      localStatus === ActionStatus.SUCCESS &&
      untrustedAssets.status === ActionStatus.SUCCESS
    ) {
      setSuccessMessage(`Untrusted asset ${assetCode} was added.`);
    }
  }, [untrustedAssets.status, localStatus, assetCode]);

  const handleSetUntrustedAsset = async () => {
    // Reset local state
    setErrorMessage("");
    setSuccessMessage("");
    setLocalStatus(ActionStatus.PENDING);

    try {
      const asset = await getValidatedUntrustedAsset({
        assetCode,
        homeDomain,
        assetIssuer,
        accountBalances: account.data?.balances,
      });

      history.push(
        getUntrustedAssetsSearchParam({
          location,
          asset,
        }),
      );
      setLocalStatus(ActionStatus.SUCCESS);
    } catch (e) {
      log.error({ title: e.toString() });
      setErrorMessage(e.toString());
      setLocalStatus(ActionStatus.ERROR);
    }
  };

  const isPending =
    untrustedAssets.status === ActionStatus.PENDING ||
    localStatus === ActionStatus.PENDING;

  console.log("isPending: ", isPending);

  return (
    <>
      {/* TODO: move to Modal component */}
      <Heading2 className="ModalHeading">Add asset</Heading2>

      <div className="ModalBody">
        <Input
          id="aa-asset-code"
          label="Asset code"
          onChange={(e) => setAssetCode(e.target.value)}
          value={assetCode}
          placeholder="ex. USD"
        />

        {/* TODO: add info icon and bubble to SDS */}
        <Input
          id="aa-home-domain"
          label="Anchor home domain"
          onChange={(e) => setHomeDomain(e.target.value)}
          value={homeDomain}
          placeholder="ex. example.com"
        />

        <Input
          id="aa-asset-issuer"
          label="Issuer public key"
          onChange={(e) => setAssetIssuer(e.target.value)}
          value={assetIssuer}
        />
      </div>

      {errorMessage && localStatus && (
        <div className="ModalMessage error">
          <p>{errorMessage}</p>
        </div>
      )}

      {successMessage && localStatus && (
        <div className="ModalMessage success">
          <p>{successMessage}</p>
        </div>
      )}

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button
          onClick={handleSetUntrustedAsset}
          disabled={!(assetCode && (homeDomain || assetIssuer)) || isPending}
        >
          Add
        </Button>
      </div>
    </>
  );
};
