import { useState } from "react";
import { useDispatch } from "react-redux";
import { Modal, Input, Button } from "@stellar/design-system";
import { createPasskeyContract } from "../ducks/contractAccount";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { AppDispatch } from "../config/store";
import { ChangeEvent } from "react";

interface CreatePasskeyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePasskeyModal = ({ visible, onClose }: CreatePasskeyModalProps) => {
  const [passkeyName, setPasskeyName] = useState("");
  const dispatch: AppDispatch = useDispatch();

  const handleSubmit = async () => {
    if (passkeyName.trim()) {
      dispatch(createPasskeyContract(passkeyName.trim()));
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      parentId={CSS_MODAL_PARENT_ID}
    >
      <Modal.Heading>Create Passkey</Modal.Heading>
      <Modal.Body>
        <Input
          id="passkey-name"
          label="Your passkey name"
          value={passkeyName}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPasskeyName(e.target.value)}
          placeholder="e.g., Alice’s Contract Key"
        />
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button onClick={handleSubmit} disabled={!passkeyName.trim()}>
            Create
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}; 