import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, InfoBlock, Modal } from "@stellar/design-system";
import { getAssetFromHomeDomain } from "demo-wallet-shared/build/helpers/getAssetFromHomeDomain";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { Asset, SearchParams } from "types/types.d";

export const HomeDomainOverrideModal = ({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) => {
  const navigate = useNavigate();

  const [homeDomain, setHomeDomain] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleOverride = async () => {
    setErrorMessage("");
    setIsPending(true);

    const { assetCode, assetIssuer } = asset;
    const networkUrl = getNetworkConfig().url;

    try {
      const validAsset = await getAssetFromHomeDomain({
        assetCode,
        homeDomain,
        issuerPublicKey: assetIssuer,
        networkUrl,
      });

      if (validAsset.homeDomain) {
        navigate(
          searchParam.updateKeyPair({
            param: SearchParams.ASSET_OVERRIDES,
            itemId: `${asset.assetCode}:${asset.assetIssuer}`,
            keyPairs: { homeDomain },
          }),
        );

        onClose();
      } else {
        throw new Error(
          `Override home domain is the same as ${asset.assetCode} asset home domain`,
        );
      }
    } catch (e) {
      const errorMsg = getErrorMessage(e);
      setErrorMessage(errorMsg);
      log.error({ title: errorMsg });
      setIsPending(false);
    }
  };

  return (
    <>
      <Modal.Heading>Override home domain</Modal.Heading>

      <Modal.Body>
        <p>{`Asset ${asset.assetCode} currently has ${
          asset.homeDomain || "no"
        } home domain.`}</p>

        <Input
          id="hdo-home-domain"
          label="Anchor home domain"
          onChange={(e) => {
            setErrorMessage("");
            setHomeDomain(e.target.value);
          }}
          value={homeDomain}
          placeholder="ex: example.com"
        />

        {errorMessage && (
          <InfoBlock variant={InfoBlock.variant.error}>
            <p>{errorMessage}</p>
          </InfoBlock>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button
          onClick={handleOverride}
          disabled={!homeDomain}
          isLoading={isPending}
        >
          Override
        </Button>

        <Button
          onClick={onClose}
          disabled={isPending}
          variant={Button.variant.secondary}
        >
          Cancel
        </Button>
      </Modal.Footer>
    </>
  );
};
