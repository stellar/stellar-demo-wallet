import { useState, useEffect } from "react";
import { Checkbox, Input } from "@stellar/design-system";
import { Memo, StrKey } from "stellar-sdk";
import "./styles.scss";

export const CustodialFields = ({
  isValid,
}: {
  isValid: (isValid: boolean) => void;
}) => {
  const [isCustodialMode, setIsCustodialMode] = useState(false);
  const [secretKeyValue, setSecretKeyValue] = useState("");
  const [memoIdValue, setMemoIdValue] = useState("");
  const [errorSecretKey, setErrorSecretKey] = useState("");
  const [errorMemoId, setErrorMemoId] = useState("");

  const isInputsValid =
    !!secretKeyValue && !errorSecretKey && !!memoIdValue && !errorMemoId;

  useEffect(() => {
    if (isCustodialMode) {
      isValid(isInputsValid);
    } else {
      isValid(true);
    }
  }, [isCustodialMode, isInputsValid, isValid]);

  const resetLocalState = () => {
    setIsCustodialMode(false);
    setSecretKeyValue("");
    setMemoIdValue("");
    setErrorSecretKey("");
    setErrorMemoId("");
  };

  const handleCustodialModeChange = () => {
    if (isCustodialMode) {
      resetLocalState();
    }

    setIsCustodialMode(!isCustodialMode);
  };

  const validateSecretKey = (value: string) => {
    setErrorSecretKey("");
    const isSecretKeyValid = StrKey.isValidEd25519SecretSeed(value);

    if (!isSecretKeyValid) {
      setErrorSecretKey("Secret key is not valid");
    }

    // TODO: set secret key in store
  };

  const validateMemoId = (value: string) => {
    setErrorMemoId("");

    try {
      const memoId = Memo.id(value);
      // TODO: set memo id in store
      console.log(">>> memoId: ", memoId);
    } catch (e) {
      setErrorMemoId("Memo ID must be a valid 64 bit unsigned integer");
    }
  };

  return (
    <div className="CustodialFields">
      <Checkbox
        id="custodialMode"
        label="Custodial mode"
        onChange={handleCustodialModeChange}
      />

      {isCustodialMode ? (
        <div className="CustodialFields__container">
          <Input
            id="custodialSecretKey"
            label="Custodial secret key"
            placeholder="Starts with S, example: SCHK…ZLJK"
            onBlur={(e) => {
              setSecretKeyValue(e.target.value);
              validateSecretKey(e.target.value);
            }}
            error={errorSecretKey}
          />
          <Input
            id="custodialMemoId"
            label="Custodial Memo ID"
            onBlur={(e) => {
              setMemoIdValue(e.target.value);
              validateMemoId(e.target.value);
            }}
            error={errorMemoId}
          />
        </div>
      ) : null}
    </div>
  );
};
