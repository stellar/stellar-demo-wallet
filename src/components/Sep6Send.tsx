import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, InfoBlock, Input, Select } from "@stellar/design-system";
import { Heading2 } from "components/Heading";
import { Modal } from "components/Modal";
import { TextLink } from "components/TextLink";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  resetSep6DepositAction,
  submitSep6DepositFields,
  sep6DepositAction,
} from "ducks/sep6DepositAsset";
import { useRedux } from "hooks/useRedux";
import { ActionStatus } from "types/types.d";

export const Sep6Send = () => {
  const { sep6DepositAsset } = useRedux("sep6DepositAsset");
  const { depositResponse } = sep6DepositAsset;

  const [formData, setFormData] = useState<any>({
    depositType: {},
    fields: {},
  });
  const dispatch = useDispatch();

  useEffect(() => {
    if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
      setFormData({
        depositType: {
          type: sep6DepositAsset.data.depositTypes.type.choices[0],
        },
        fields: {},
      });
    }
  }, [
    sep6DepositAsset.status,
    sep6DepositAsset.data.depositTypes.type.choices,
    dispatch,
  ]);

  useEffect(() => {
    if (sep6DepositAsset.status === ActionStatus.CAN_PROCEED) {
      dispatch(sep6DepositAction());
    }
  }, [sep6DepositAsset.status, dispatch]);

  const resetLocalState = () => {
    setFormData({});
  };

  const handleClose = () => {
    dispatch(resetSep6DepositAction());
    dispatch(resetActiveAssetAction());
    resetLocalState();
  };

  const handleDepositTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      depositType: {
        ...formData.depositType,
        [id]: value,
      },
    };

    setFormData(updatedState);
  };

  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      fields: {
        ...formData.fields,
        [id]: value,
      },
    };

    setFormData(updatedState);
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6DepositFields({ ...formData }));
  };

  const depositTypeChoices =
    sep6DepositAsset.data.depositTypes?.type?.choices || [];

  if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <Heading2
          className="ModalHeading"
          tooltipText={
            <>
              These are the fields the receiving anchor requires. The sending
              client obtains them from the /customer endpoint.{" "}
              <TextLink
                href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get"
                isExternal
              >
                Learn more
              </TextLink>
            </>
          }
        >
          SEP-6 Required Info
        </Heading2>
        <div className="ModalBody">
          {Object.entries(sep6DepositAsset.data.depositTypes || {}).map(
            ([id, input]) => (
              <>
                <label>{input.description}</label>
                <Select id={id} key={id} onChange={handleDepositTypeChange}>
                  {depositTypeChoices.map((choice: string) => (
                    <option key={choice} value={choice}>
                      {choice}
                    </option>
                  ))}
                </Select>
              </>
            ),
          )}
          {Object.entries(sep6DepositAsset.data.fields || {}).map(
            ([id, input]) => (
              <Input
                key={id}
                id={id}
                label={input.description}
                required
                onChange={handleFieldChange}
              />
            ),
          )}
        </div>

        <div className="ModalButtonsFooter">
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </Modal>
    );
  }

  if (sep6DepositAsset.status === ActionStatus.SUCCESS) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <Heading2 className="ModalHeading">SEP-6 Deposit Info</Heading2>

        <div className="ModalBody">
          <InfoBlock>{depositResponse.how}</InfoBlock>

          {depositResponse.extra_info?.message && (
            <InfoBlock>{depositResponse.extra_info.message}</InfoBlock>
          )}

          {depositResponse.max_amount && (
            <InfoBlock>
              <strong>Max Amount: </strong>

              {depositResponse.max_amount}
            </InfoBlock>
          )}

          {depositResponse.min_amount && (
            <InfoBlock>
              <strong>Min Amount: </strong>

              {depositResponse.min_amount}
            </InfoBlock>
          )}
        </div>
      </Modal>
    );
  }

  return null;
};
