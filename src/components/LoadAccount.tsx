import { useState } from "react";
import {
  Button,
  Input,
  TextButton,
  TextButtonVariant,
} from "@stellar/design-system";
import { useHistory } from "react-router-dom";
import { getNetworkSearchParam } from "helpers/getNetworkSearchParam";
import { getSecretKeySearchParam } from "helpers/getSecretKeySearchParam";

export const LoadAccount = () => {
  const [secretKey, setSecretKey] = useState("");
  const history = useHistory();

  const handleSetSecretKey = () => {
    // TODO: validate secretKey
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
        pubnet: true,
      }),
    );
  };

  return (
    <div>
      <Input
        id="secretKey"
        label="Enter your Stellar secret key"
        onChange={(e) => setSecretKey(e.target.value)}
        value={secretKey}
      />
      <Button onClick={handleSetSecretKey} disabled={!secretKey}>
        OK
      </Button>

      {/* TODO: make this checkbox */}
      <TextButton
        onClick={handleSwitchNetwork}
        variant={TextButtonVariant.secondary}
      >
        Use mainnet
      </TextButton>
    </div>
  );
};
