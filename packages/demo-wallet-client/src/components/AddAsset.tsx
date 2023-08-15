import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  InfoBlock,
  TextLink,
  Modal,
  Input,
  DetailsTooltip,
} from "@stellar/design-system";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { getValidatedUntrustedAsset } from "demo-wallet-shared/build/helpers/getValidatedUntrustedAsset";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { log } from "demo-wallet-shared/build/helpers/log";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types";

export const AddAsset = ({ onClose }: { onClose: () => void }) => {
  const { account, untrustedAssets } = useRedux("account", "untrustedAssets");

  const [isValidating, setIsValidating] = useState(false);
  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [issuerPublicKey, setIssuerPublicKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

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
        networkUrl: getNetworkConfig().url,
      });

      let search = searchParam.update(
        SearchParams.UNTRUSTED_ASSETS,
        `${asset.assetCode}:${asset.assetIssuer}`,
      );

      if (asset.homeDomain) {
        search = searchParam.updateKeyPair({
          param: SearchParams.ASSET_OVERRIDES,
          itemId: `${asset.assetCode}:${asset.assetIssuer}`,
          keyPairs: { homeDomain },
          urlSearchParams: new URLSearchParams(search),
        });
      }

      navigate(search);
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
      <Modal.Heading>Add asset</Modal.Heading>

      <Modal.Body>
        <p>Required: asset code AND (home domain OR issuer)</p>

        <Input
          id="aa-asset-code"
          label={
            <DetailsTooltip
              details={
                <>
                  Assets are identified by 1) their code and 2) either a home
                  domain or the public key of the issuing account.{" "}
                  <TextLink href="https://developers.stellar.org/docs/issuing-assets/publishing-asset-info/">
                    Learn more
                  </TextLink>
                </>
              }
              isInline
              tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
            >
              <>Asset code</>
            </DetailsTooltip>
          }
          onChange={(e) => {
            setErrorMessage("");
            setAssetCode(e.target.value);
          }}
          value={assetCode}
          placeholder="ex: USDC, EURT, NGNT"
        />

        <Input
          id="aa-home-domain"
          label={
            <DetailsTooltip
              details={
                <>
                  Domain where the well-known TOML file can be found for this
                  asset.{" "}
                  <TextLink href="https://developers.stellar.org/docs/issuing-assets/publishing-asset-info/#what-is-a-stellartoml">
                    Learn more
                  </TextLink>
                </>
              }
              isInline
              tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
            >
              <>Anchor home domain</>
            </DetailsTooltip>
          }
          onChange={(e) => {
            setErrorMessage("");
            setHomeDomain(e.target.value);
          }}
          value={homeDomain}
          placeholder="ex: example.com"
        />

        <Input
          id="aa-public-key"
          label={
            <DetailsTooltip
              details={
                <>
                  Public key for the Asset Issuer.{" "}
                  <TextLink href="https://developers.stellar.org/docs/issuing-assets/how-to-issue-an-asset">
                    Learn more
                  </TextLink>
                </>
              }
              isInline
              tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
            >
              <>Issuer public key</>
            </DetailsTooltip>
          }
          onChange={(e) => {
            setErrorMessage("");
            setIssuerPublicKey(e.target.value);
          }}
          value={issuerPublicKey}
          placeholder="ex: GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B"
        />

        {errorMessage && (
          <InfoBlock variant={InfoBlock.variant.error}>
            <p>{errorMessage}</p>
          </InfoBlock>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleSetUntrustedAsset}
          disabled={!assetCode}
          isLoading={isPending}
        >
          Add
        </Button>
      </Modal.Footer>
    </>
  );
};
