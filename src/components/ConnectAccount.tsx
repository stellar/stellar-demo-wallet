import { useState } from "react";
import { Button, Checkbox, Input, Loader, Modal } from "@stellar/design-system";
import { useHistory } from "react-router-dom";
import { searchParam } from "helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";

export const ConnectAccount = () => {
  const { account, settings } = useRedux("account", "settings");
  const [secretKey, setSecretKey] = useState("");
  const history = useHistory();

  const handleSetSecretKey = () => {
    history.push(searchParam.update(SearchParams.SECRET_KEY, secretKey));
  };

  const handleSwitchNetwork = () => {
    history.push(
      searchParam.update(SearchParams.PUBNET, (!settings.pubnet).toString()),
    );
  };

  return (
    <>
      <Modal.Heading>Connect with a secret key</Modal.Heading>

      <Modal.Body>
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
      </Modal.Body>

      <Modal.Footer>
        {account.status === ActionStatus.PENDING && <Loader />}

        <Button
          onClick={handleSetSecretKey}
          disabled={!secretKey || account.status === ActionStatus.PENDING}
        >
          Connect
        </Button>
      </Modal.Footer>
    </>
  );
};
