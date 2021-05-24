import React, { useEffect, useMemo, useState } from "react";
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

export const Sep6Deposit = () => {
  const { sep6DepositAsset } = useRedux("sep6DepositAsset");
  const {
    data: { depositResponse },
  } = sep6DepositAsset;

  interface FormData {
    depositType: {
      type: string;
    };
    infoFields: {
      [key: string]: string;
    };
    customerFields: {
      [key: string]: string;
    };
  }

  const formInitialState: FormData = {
    depositType: {
      type: "",
    },
    infoFields: {},
    customerFields: {},
  };

  const [formData, setFormData] = useState<FormData>(formInitialState);
  const dispatch = useDispatch();

  const depositTypeChoices = useMemo(
    () => sep6DepositAsset.data.infoFields?.type?.choices || [],
    [sep6DepositAsset],
  );

  useEffect(() => {
    if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
      setFormData({
        depositType: {
          type: depositTypeChoices[0],
        },
        infoFields: {},
        customerFields: {},
      });
    }
  }, [sep6DepositAsset.status, depositTypeChoices, dispatch]);

  useEffect(() => {
    if (sep6DepositAsset.status === ActionStatus.CAN_PROCEED) {
      dispatch(sep6DepositAction());
    }
  }, [sep6DepositAsset.status, dispatch]);

  const resetLocalState = () => {
    setFormData(formInitialState);
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

  const handleInfoFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      infoFields: {
        ...formData.infoFields,
        [id]: value,
      },
    };

    setFormData(updatedState);
  };

  const handleCustomerFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      customerFields: {
        ...formData.customerFields,
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

  if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <div className="ModalBody">
          <Heading2
            className="ModalHeading"
            tooltipText={
              <>
                These are the fields the receiving anchor requires. The sending
                client obtains them from the /info endpoint.{" "}
                <TextLink
                  href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info"
                  isExternal
                >
                  Learn more
                </TextLink>
              </>
            }
          >
            SEP-6 Required Info
          </Heading2>
          <div className="vertical-spacing">
            {Object.entries(sep6DepositAsset.data.infoFields || {}).map(
              ([id, input]) =>
                id === "type" ? (
                  <div key={id}>
                    <Select
                      label={input.description}
                      id={id}
                      key={id}
                      onChange={handleDepositTypeChange}
                    >
                      {depositTypeChoices.map((choice: string) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <Input
                    key={id}
                    id={id}
                    label={input.description}
                    required
                    onChange={handleInfoFieldChange}
                  />
                ),
            )}
          </div>

          {Object.keys(sep6DepositAsset.data.customerFields).length ? (
            <Heading2
              className="ModalHeading"
              tooltipText={
                <>
                  These are the fields the receiving anchor requires. The
                  sending client obtains them from the /customer endpoint.{" "}
                  <TextLink
                    href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get"
                    isExternal
                  >
                    Learn more
                  </TextLink>
                </>
              }
            >
              SEP-12 Required Info
            </Heading2>
          ) : null}
          <div className="vertical-spacing">
            {Object.entries(sep6DepositAsset.data.customerFields || {}).map(
              ([id, input]) => (
                <Input
                  key={id}
                  id={id}
                  label={input.description}
                  required
                  onChange={handleCustomerFieldChange}
                />
              ),
            )}
          </div>
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
