import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, ButtonVariant, Select } from "@stellar/design-system";
import { Heading2, Heading3 } from "components/Heading";
import { Input } from "components/Input";
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
    amount?: string;
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
    amount: "",
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
        amount: "",
        depositType: {
          type: depositTypeChoices[0],
        },
        infoFields: {},
        customerFields: {},
      });
    }
  }, [sep6DepositAsset.status, depositTypeChoices, dispatch]);

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

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      [id]: value.toString(),
    };

    setFormData(updatedState);
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6DepositFields({ ...formData }));
  };

  const renderMinMaxAmount = () => {
    const { minAmount, maxAmount } = sep6DepositAsset.data;

    if (minAmount === 0 && maxAmount === 0) {
      return null;
    }

    return `Min: ${minAmount} | Max: ${maxAmount}`;
  };

  if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <div className="ModalBody">
          <Heading2 className="ModalHeading">SEP-6 Deposit Info</Heading2>

          <div className="vertical-spacing">
            <Input
              id="amount"
              label="Amount (optional)"
              onChange={handleAmountChange}
              type="number"
              tooltipText={
                <>
                  The amount of the asset the user would like to deposit with
                  the anchor. This field may be necessary for the anchor to
                  determine what KYC information is necessary to collect.{" "}
                  <TextLink
                    href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed"
                    isExternal
                  >
                    Learn more
                  </TextLink>
                </>
              }
              note={renderMinMaxAmount()}
            />
          </div>

          <Heading3
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
          </Heading3>
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
            <Heading3
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
            </Heading3>
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
          <Button onClick={handleClose} variant={ButtonVariant.secondary}>
            Cancel
          </Button>
        </div>
      </Modal>
    );
  }

  if (sep6DepositAsset.status === ActionStatus.CAN_PROCEED) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <Heading2 className="ModalHeading">How SEP-6 Deposits Work</Heading2>

        <div className="ModalBody">
          <div className="vertical-spacing">{depositResponse.how}</div>

          {depositResponse.extra_info?.message && (
            <div className="vertical-spacing">
              {depositResponse.extra_info.message}
            </div>
          )}
        </div>

        <div className="ModalButtonsFooter">
          <Button onClick={() => dispatch(sep6DepositAction())}>Proceed</Button>
          <Button onClick={handleClose} variant={ButtonVariant.secondary}>
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  return null;
};
