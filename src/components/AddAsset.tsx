import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  Heading2,
  InfoBlock,
  InfoBlockVariant,
  Loader,
} from "@stellar/design-system";
import { Input } from "components/Input";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { getValidatedUntrustedAsset } from "helpers/getValidatedUntrustedAsset";
import { searchParam } from "helpers/searchParam";
import { log } from "helpers/log";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";
import { TextLink } from "./TextLink";

export const AddAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, settings, untrustedAssets } = useRedux(
    "account",
    "settings",
    "untrustedAssets",
  );

  const [isValidating, setIsValidating] = useState(false);
  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [issuerPublicKey, setIssuerPublicKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const history = useHistory();

  const resetState = () => {
    setAssetCode("");
    setHomeDomain("");
    setIssuerPublicKey("");
    setErrorMessage("");
    setIsValidating(false);
  };

  useEffect(() => () => resetState(), []);

  useEffect(() => {
    if (untrustedAssets.status === ActionStatus.SUCCESS) {
      onClose();
    }

    if (untrustedAssets.errorString) {
      setErrorMessage(untrustedAssets.errorString);
    }
  }, [untrustedAssets.status, untrustedAssets.errorString, onClose]);

  const handleSetUntrustedAsset = async () => {
    setErrorMessage("");

    if (!(homeDomain || issuerPublicKey)) {
      const errorMsg =
        "Home domain OR issuer public key is required with asset code";

      log.error({ title: errorMsg });
      setErrorMessage(errorMsg);
      return;
    }

    setIsValidating(true);

    try {
      const asset = await getValidatedUntrustedAsset({
        assetCode,
        homeDomain,
        issuerPublicKey,
        accountBalances: account.data?.balances,
        networkUrl: getNetworkConfig(settings.pubnet).url,
      });

      let search = searchParam.update(
        SearchParams.UNTRUSTED_ASSETS,
        `${asset.assetCode}:${asset.assetIssuer}`,
      );

      if (asset.homeDomain) {
        search = searchParam.updateKeyPair({
          searchParam: SearchParams.ASSET_OVERRIDES,
          itemId: `${asset.assetCode}:${asset.assetIssuer}`,
          keyPairs: { homeDomain },
          urlSearchParams: new URLSearchParams(search),
        });
      }

      history.push(search);
      setIsValidating(false);
    } catch (e) {
      const errorMsg = getErrorMessage(e);

      log.error({ title: errorMsg });
      setErrorMessage(errorMsg);
      setIsValidating(false);
    }
  };

  const isPending =
    isValidating || untrustedAssets.status === ActionStatus.PENDING;

  return (
    <>
      {/* TODO: move to Modal component */}
      <Heading2 className="ModalHeading">Add asset</Heading2>

      <div className="ModalBody">
        <p>Required: asset code AND (home domain OR issuer)</p>

        <Input
          id="aa-asset-code"
          label="Asset code"
          onChange={(e) => {
            setErrorMessage("");
            setAssetCode(e.target.value);
          }}
          value={assetCode}
          placeholder="ex: USDC, EURT, NGNT"
          tooltipText={
            <>
              Assets are identified by 1) their code and 2) either a home domain
              or the public key of the issuing account.{" "}
              <TextLink
                href="https://developers.stellar.org/docs/issuing-assets/publishing-asset-info/"
                isExternal
              >
                Learn more
              </TextLink>
            </>
          }
        />

        <Input
          id="aa-home-domain"
          label="Anchor home domain"
          onChange={(e) => {
            setErrorMessage("");
            setHomeDomain(e.target.value);
          }}
          value={homeDomain}
          placeholder="ex: example.com"
          tooltipText={
            <>
              Domain where the well-known TOML file can be found for this asset.{" "}
              <TextLink
                href="https://developers.stellar.org/docs/issuing-assets/publishing-asset-info/#what-is-a-stellartoml"
                isExternal
              >
                Learn more
              </TextLink>
            </>
          }
        />

        <Input
          id="aa-public-key"
          label="Issuer public key"
          onChange={(e) => {
            setErrorMessage("");
            setIssuerPublicKey(e.target.value);
          }}
          value={issuerPublicKey}
          placeholder="ex: GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B"
          tooltipText={
            <>
              Public key for the Asset Issuer.{" "}
              <TextLink
                href="https://developers.stellar.org/docs/issuing-assets/how-to-issue-an-asset"
                isExternal
              >
                Learn more
              </TextLink>
            </>
          }
        />

        {errorMessage && (
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
