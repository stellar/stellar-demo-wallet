import { useState } from "react";
import { Button, Checkbox, Input, Modal } from "@stellar/design-system";
import { useNavigate } from "react-router-dom";
import { searchParam } from "demo-wallet-shared/build/helpers/searchParam";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, SearchParams } from "types/types.d";

export const ConnectAccount = () => {
  const { account, settings } = useRedux("account", "settings");
  const [secretKey, setSecretKey] = useState("");
  const navigate = useNavigate();

  const handleSetSecretKey = () => {
    navigate(searchParam.update(SearchParams.SECRET_KEY, secretKey));
  };

  const handleSwitchNetwork = () => {
    navigate(
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
        <Button
          onClick={handleSetSecretKey}
          disabled={!secretKey}
          isLoading={account.status === ActionStatus.PENDING}
        >
          Connect
        </Button>
      </Modal.Footer>
    </>
  );
};
