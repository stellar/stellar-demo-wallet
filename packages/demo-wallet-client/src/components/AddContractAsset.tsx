import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, InfoBlock, Modal } from "@stellar/design-system";
import { getErrorMessage } from "demo-wallet-shared/build/helpers/getErrorMessage";
import { getNetworkConfig } from "demo-wallet-shared/build/helpers/getNetworkConfig";
import { log } from "demo-wallet-shared/build/helpers/log";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { Horizon } from "@stellar/stellar-sdk";
import { isNativeAsset } from "demo-wallet-shared/build/helpers/isNativeAsset";

export const AddContractAsset = ({ onClose }: { onClose: () => void }) => {
  const [assetCode, setAssetCode] = useState("");
  const [issuerPublicKey, setIssuerPublicKey] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const validateContractAsset = async (code: string, issuer: string, domain?: string) => {
    const networkUrl = getNetworkConfig().url;
    const server = new Horizon.Server(networkUrl);

    // Handle XLM/native asset
    if (isNativeAsset(code)) {
      return {
        assetCode: "XLM",
        assetIssuer: "native",
        homeDomain: domain,
      };
    }

    // Validate non-native asset exists on Stellar network
    if (!issuer) {
      throw new Error("Issuer public key is required for non-native assets");
    }

    try {
      const assetResponse = await server
        .assets()
        .forCode(code)
        .forIssuer(issuer)
        .call();

      if (!assetResponse.records.length) {
        throw new Error(`Asset ${code}:${issuer} does not exist on the Stellar network`);
      }

      return {
        assetCode: code,
        assetIssuer: issuer,
        homeDomain: domain,
      };
    } catch (error) {
      throw new Error(`Failed to validate asset: ${getErrorMessage(error)}`);
    }
  };

  const handleSetContractAsset = async () => {
    setErrorMessage("");
    setIsValidating(true);

    try {
      const asset = await validateContractAsset(assetCode, issuerPublicKey, homeDomain);
      const search = searchParam.update(
        "contractAssets" as any,
        `${asset.assetCode}:${asset.assetIssuer}`,
      );
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