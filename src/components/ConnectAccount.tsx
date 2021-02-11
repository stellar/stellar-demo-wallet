import { useState } from "react";
import {
  Button,
  Checkbox,
  Heading2,
  InfoBlock,
  InfoBlockVariant,
  Input,
  Loader,
} from "@stellar/design-system";
import { useHistory } from "react-router-dom";
import { getNetworkSearchParam } from "helpers/getNetworkSearchParam";
import { getSecretKeySearchParam } from "helpers/getSecretKeySearchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const ConnectAccount = () => {
  const { account, settings } = useRedux("account", "settings");
  const [secretKey, setSecretKey] = useState("");
  const history = useHistory();

  const handleSetSecretKey = () => {
    history.push(
      getSecretKeySearchParam({
        location,
        secretKey,
      }),
    );
  };

  const handleSwitchNetwork = () => {
    history.push(
      getNetworkSearchParam({
        location,
        pubnet: !settings.pubnet,
      }),
    );
  };

  return (
    <>
      {/* TODO: move to Modal component */}
      <Heading2 className="ModalHeading">Connect with a secret key</Heading2>

      <div className="ModalBody">
        {/* TODO: update warning copy */}
        <InfoBlock variant={InfoBlockVariant.error}>
          ATTENTION: Entering a secret key on any website is not recommended.
          [UPDATE COPY]
        </InfoBlock>

        <Input
          id="secretKey"
          label="Your secret key"
          onChange={(e) => setSecretKey(e.target.value)}
          value={secretKey}
          placeholder="Starts with S, example: SCHK…ZLJK"
        />

        <Checkbox
          id="use-pubnet"
          label="Operate on pubnet (NOT RECOMMENDED)"
          checked={settings.pubnet}
          onChange={handleSwitchNetwork}
        />
      </div>

      <div className="ModalButtonsFooter">
        {account.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSetSecretKey}
          disabled={!secretKey || account.status === ActionStatus.PENDING}
        >
          Connect
        </Button>
      </div>
    </>
  );
};
