import { useState } from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  Heading2,
  Input,
  InfoBlock,
  Loader,
} from "@stellar/design-system";
import { getAssetFromHomeDomain } from "helpers/getAssetFromHomeDomain";
import { getErrorMessage } from "helpers/getErrorMessage";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { log } from "helpers/log";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { Asset, SearchParams } from "types/types.d";

export const HomeDomainOverrideModal = ({
  asset,
  onClose,
}: {
  asset: Asset;
  onClose: () => void;
}) => {
  const { settings } = useRedux("settings");
  const history = useHistory();

  const [homeDomain, setHomeDomain] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleOverride = async () => {
    setErrorMessage("");
    setIsPending(true);

    const { assetCode, assetIssuer } = asset;
    const networkUrl = getNetworkConfig(settings.pubnet).url;

    try {
      const validAsset = await getAssetFromHomeDomain({
        assetCode,
        homeDomain,
        issuerPublicKey: assetIssuer,
        networkUrl,
      });

      if (validAsset.homeDomain) {
        history.push(
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
      <Heading2 className="ModalHeading">Override home domain</Heading2>

      <div className="ModalBody">
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
      </div>

      <div className="ModalButtonsFooter">
        {isPending && <Loader />}

        <Button onClick={handleOverride} disabled={!homeDomain || isPending}>
          Override
        </Button>

        <Button
          onClick={onClose}
          disabled={isPending}
          variant={Button.variant.secondary}
        >
          Cancel
        </Button>
      </div>
    </>
  );
};
