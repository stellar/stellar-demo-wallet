import { useState } from "react";
import { Input, Button } from "@stellar/design-system";
import { useHistory } from "react-router-dom";
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
    </div>
  );
};
