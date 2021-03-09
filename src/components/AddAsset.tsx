import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  Heading2,
  InfoBlock,
  InfoBlockVariant,
  Input,
  Loader,
} from "@stellar/design-system";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { getUntrustedAssetsSearchParam } from "helpers/getUntrustedAssetsSearchParam";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const AddAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, settings, untrustedAssets } = useRedux(
    "account",
    "settings",
    "untrustedAssets",
  );

  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [issuerPublicKey, setIssuerPublicKey] = useState("");
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

    if (localStatus === ActionStatus.SUCCESS && untrustedAssets.errorString) {
      setErrorMessage(untrustedAssets.errorString);
    }
  }, [
    untrustedAssets.status,
    untrustedAssets.errorString,
    localStatus,
    onClose,
  ]);

  const handleSetUntrustedAsset = async () => {
    // Reset local state
    setErrorMessage("");
    setLocalStatus(ActionStatus.PENDING);

    try {
      const asset = await getValidatedUntrustedAsset({
        assetCode,
        homeDomain,
        issuerPublicKey,
        accountBalances: account.data?.balances,
        networkUrl: getNetworkConfig(settings.pubnet).url,
      });

      history.push(
        getUntrustedAssetsSearchParam({
          location,
          asset,
        }),
      );
      setLocalStatus(ActionStatus.SUCCESS);
    } catch (e) {
      setErrorMessage(e.toString());
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
          onChange={(e) => {
            setErrorMessage("");
            setLocalStatus(undefined);
            setAssetCode(e.target.value);
          }}
          value={assetCode}
          placeholder="ex: USDC, EURT, NGNT"
        />

        {/* TODO: add info icon and bubble to SDS */}
        <Input
          id="aa-home-domain"
          label="Anchor home domain"
          onChange={(e) => {
            setErrorMessage("");
            setLocalStatus(undefined);
            setHomeDomain(e.target.value);
          }}
          value={homeDomain}
          placeholder="ex: example.com"
        />

        <Input
          id="aa-public-key"
          label="Issuer public key"
          onChange={(e) => {
            setErrorMessage("");
            setLocalStatus(undefined);
            setIssuerPublicKey(e.target.value);
          }}
          value={issuerPublicKey}
          placeholder="ex: GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B"
        />

        {errorMessage && localStatus && (
          <InfoBlock variant={InfoBlockVariant.error}>
            <p>{errorMessage}</p>
          </InfoBlock>
        )}
      </div>

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button
          onClick={handleSetUntrustedAsset}
          disabled={!assetCode || isPending}
        >
          Add
        </Button>
      </div>
    </>
  );
};
