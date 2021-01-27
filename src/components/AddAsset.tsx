import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { Button, ButtonVariant, Input, Loader } from "@stellar/design-system";
import { getIssuerFromDomain } from "helpers/getIssuerFromDomain";
import { getUntrustedAssetsSearchParam } from "helpers/getUntrustedAssetsSearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const AddAsset = ({ onCancel }: { onCancel: () => void }) => {
  const { account, untrustedAssets } = useRedux("account", "untrustedAssets");

  // Form data
  const [assetCode, setAssetCode] = useState("");
  const [homeDomain, setHomeDomain] = useState("");
  const [assetIssuer, setAssetIssuer] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const history = useHistory();

  const resetFormState = () => {
    setAssetCode("");
    setHomeDomain("");
    setAssetIssuer("");
    setErrorMessage("");
  };

  useEffect(() => {
    if (untrustedAssets.status === ActionStatus.SUCCESS) {
      resetFormState();
    }
  }, [untrustedAssets.status]);

  const handleSetUntrustedAsset = async () => {
    setErrorMessage("");

    if (!assetCode && !(assetIssuer || homeDomain)) {
      throw new Error("REQUIRED: asset code AND (home domain OR issuer)");
    }

    let asset;

    if (assetIssuer) {
      asset = `${assetCode}:${assetIssuer}`;
    } else {
      try {
        const homeDomainIssuer = await getIssuerFromDomain({
          assetCode,
          homeDomain,
        });

        asset = `${assetCode}:${homeDomainIssuer}`;
      } catch (e) {
        console.log("Issuer domain error: ", e.toString());
        setErrorMessage(e.toString());
        return;
      }
    }

    // Is asset already trusted
    if (account.data?.balances[asset]) {
      console.log(`Asset ${asset} is already trusted.`);
      setErrorMessage(`Asset ${asset} is already trusted.`);
      return;
    }

    try {
      history.push(
        getUntrustedAssetsSearchParam({
          location,
          asset,
        }),
      );
    } catch (e) {
      console.log("Add asset error: ", e.toString());
      setErrorMessage(e.toString());
    }
  };

  return (
    <div className="SendForm Block">
      <Input
        id="aa-asset-code"
        label="Asset code"
        onChange={(e) => setAssetCode(e.target.value)}
        value={assetCode}
        placeholder="ex. USD"
      />
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

      <div className="SendFormButtons">
        <Button onClick={handleSetUntrustedAsset}>Submit</Button>
        <Button onClick={onCancel} variant={ButtonVariant.secondary}>
          Cancel
        </Button>
        {untrustedAssets.status === ActionStatus.PENDING && <Loader />}
      </div>

      {errorMessage && <div className="Error">{errorMessage}</div>}
    </div>
  );
};
