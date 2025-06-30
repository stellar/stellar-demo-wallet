import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, InfoBlock, Modal } from "@stellar/design-system";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { getValidatedAsset } from "demo-wallet-shared/build/helpers/getValidatedAsset";

export const AddContractAsset = ({ onClose }: { onClose: () => void }) => {
  const [assetCode, setAssetCode] = useState("");
  const [issuerPublicKey, setIssuerPublicKey] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleSetContractAsset = async () => {
    setErrorMessage("");
    setIsValidating(true);

    try {
      const asset = await getValidatedAsset({
        assetCode,
        issuerPublicKey,
        homeDomain,
        networkUrl: getNetworkConfig().url,
      });

      // First update the contract assets parameter
      let search = searchParam.update(
        "contractAssets" as any,
        `${asset.assetCode}:${asset.assetIssuer}`,
      );

      // If home domain is provided, also update the asset overrides
      if (asset.homeDomain) {
        search = searchParam.updateKeyPair({
          param: "assetOverrides" as any,
          itemId: `${asset.assetCode}:${asset.assetIssuer}`,
          keyPairs: { homeDomain: asset.homeDomain },
          urlSearchParams: new URLSearchParams(search),
        });
      }

      navigate(search);
      setIsValidating(false);
      log.instruction({
        title: `Asset \`${asset.assetCode}:${asset.assetIssuer}\` added`,
      });
      onClose();
    } catch (e) {
      const errorMsg = getErrorMessage(e);

      log.error({ title: errorMsg });
      setErrorMessage(errorMsg);
      setIsValidating(false);
    }
  };

  const isPending = isValidating;

  return (
    <>
      <Modal.Heading>Add contract asset</Modal.Heading>

      <Modal.Body>
        <p>Add an asset to track in your contract account</p>

        <Input
          id="caa-asset-code"
          label="Asset code"
          onChange={(e) => {
            setErrorMessage("");
            setAssetCode(e.target.value);
          }}
          value={assetCode}
          placeholder="ex: USDC"
        />

        <Input
          id="caa-home-domain"
          label="Anchor home domain (optional)"
          onChange={(e) => {
            setErrorMessage("");
            setHomeDomain(e.target.value);
          }}
          value={homeDomain}
          placeholder="ex: example.com"
        />

        <Input
          id="caa-issuer-public-key"
          label="Issuer public key (optional)"
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
          onClick={handleSetContractAsset}
          disabled={!assetCode || isPending}
          isLoading={isPending}
        >
          Add
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