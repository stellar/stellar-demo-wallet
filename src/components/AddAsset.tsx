import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, Heading2, Input, Loader } from "@stellar/design-system";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getUntrustedAssetsSearchParam } from "helpers/getUntrustedAssetsSearchParam";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { log } from "helpers/log";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const AddAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, untrustedAssets } = useRedux("account", "untrustedAssets");

  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [localStatus, setLocalStatus] = useState<ActionStatus | undefined>();

  const history = useHistory();

  const resetState = () => {
    setAssetCode("");
    setHomeDomain("");
    setErrorMessage("");
    setLocalStatus(undefined);
  };

  useEffect(() => () => resetState(), []);

  useEffect(() => {
    if (
      localStatus === ActionStatus.SUCCESS &&
      untrustedAssets.status === ActionStatus.SUCCESS
    ) {
      onClose();
    }
  }, [untrustedAssets.status, localStatus, onClose]);

  const handleSetUntrustedAsset = async () => {
    // Reset local state
    setErrorMessage("");
    setLocalStatus(ActionStatus.PENDING);

    try {
      const asset = await getValidatedUntrustedAsset({
        assetCode,
        homeDomain,
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
      const errorMsg = getErrorMessage(e);

      log.error({ title: errorMsg });
      setErrorMessage(errorMsg);
      setLocalStatus(ActionStatus.ERROR);
    }
  };

  const isPending =
    untrustedAssets.status === ActionStatus.PENDING ||
    localStatus === ActionStatus.PENDING;

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
      </div>

      {errorMessage && localStatus && (
        <div className="ModalMessage error">
          <p>{errorMessage}</p>
        </div>
      )}

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button
          onClick={handleSetUntrustedAsset}
          disabled={!(assetCode && homeDomain) || isPending}
        >
          Add
        </Button>
      </div>
    </>
  );
};
