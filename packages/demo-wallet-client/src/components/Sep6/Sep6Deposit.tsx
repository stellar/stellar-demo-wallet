import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  Select,
  TextLink,
  Modal,
  Heading3,
  Input,
  DetailsTooltip,
} from "@stellar/design-system";

import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { KycField, KycFieldInput } from "components/KycFieldInput";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  resetSep6DepositAction,
  submitSep6DepositFields,
  sep6DepositAction,
  submitSep6CustomerInfoFields,
} from "ducks/sep6DepositAsset";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { ActionStatus } from "types/types";

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
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(true);

  const dispatch: AppDispatch = useDispatch();

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
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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

  const handleSubmitCustomerInfo = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6CustomerInfoFields(formData.customerFields));
  };

  const renderMinMaxAmount = () => {
    const { minAmount, maxAmount } = sep6DepositAsset.data;

    if (minAmount === 0 && maxAmount === 0) {
      return null;
    }

    return `Min: ${minAmount} | Max: ${maxAmount}`;
  };

  if (sep6DepositAsset.status === ActionStatus.NEEDS_KYC) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Customer Info</Modal.Heading>
        <Modal.Body>
          {Object.keys(sep6DepositAsset.data.customerFields).length ? (
            <Heading3>
              <DetailsTooltip
                details={
                  <>
                    These are the fields the receiving anchor requires. The
                    sending client obtains them from the /customer endpoint.{" "}
                    <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#customer-get">
                      Learn more
                    </TextLink>
                  </>
                }
                isInline
                tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
              >
                <>SEP-12 Required Info</>
              </DetailsTooltip>
            </Heading3>
          ) : null}
          <div className="vertical-spacing">
            {Object.entries(sep6DepositAsset.data.customerFields || {}).map(
              ([id, input]) => (
                <KycFieldInput
                  id={id}
                  input={input as KycField}
                  onChange={handleCustomerFieldChange}
                />
              ),
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6DepositAsset.status === ActionStatus.NEEDS_INPUT) {
    if (
      sep6DepositAsset.data.requiredCustomerInfoUpdates &&
      sep6DepositAsset.data.requiredCustomerInfoUpdates.length
    ) {
      return (
        <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
          <Modal.Heading>SEP-6 Update Customer Info</Modal.Heading>
          <Modal.Body>
            <div className="vertical-spacing">
              {sep6DepositAsset.data.requiredCustomerInfoUpdates.map(
                (input) => (
                  <KycFieldInput
                    id={input.id}
                    input={input as KycField}
                    onChange={handleCustomerFieldChange}
                    isRequired={true}
                  />
                ),
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleSubmitCustomerInfo}>Submit</Button>
            <Button onClick={handleClose} variant={Button.variant.secondary}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }

    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Deposit Info</Modal.Heading>
        <Modal.Body>
          <div className="vertical-spacing">
            <Input
              id="amount"
              // TODO: change type in SDS
              // @ts-ignore
              label={
                <DetailsTooltip
                  details={
                    <>
                      The amount of the asset the user would like to deposit
                      with the anchor. This field may be necessary for the
                      anchor to determine what KYC information is necessary to
                      collect.{" "}
                      <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#1-success-no-additional-information-needed">
                        Learn more
                      </TextLink>
                    </>
                  }
                  isInline
                  tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
                >
                  <>Amount (optional)</>
                </DetailsTooltip>
              }
              onChange={handleAmountChange}
              type="number"
              note={renderMinMaxAmount()}
            />
          </div>

          <Heading3>
            <DetailsTooltip
              details={
                <>
                  These are the fields the receiving anchor requires. The
                  sending client obtains them from the /info endpoint.{" "}
                  <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#info">
                    Learn more
                  </TextLink>
                </>
              }
              isInline
              tooltipPosition={DetailsTooltip.tooltipPosition.BOTTOM}
            >
              <>SEP-6 Required Info</>
            </DetailsTooltip>
          </Heading3>
          <div className="vertical-spacing">
            {Object.entries(sep6DepositAsset.data.infoFields || {}).map(
              ([id, input]) =>
                id === "type" ? (
                  <div key={id}>
                    <Select
                      label={(input as any).description}
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
                    label={(input as any).description}
                    required
                    onChange={handleInfoFieldChange}
                  />
                ),
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6DepositAsset.status === ActionStatus.CAN_PROCEED) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Deposit Details</Modal.Heading>

        <Modal.Body>
          <p>{depositResponse.how}</p>

          {depositResponse.extra_info?.message && (
            <p>{depositResponse.extra_info.message}</p>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => dispatch(sep6DepositAction())}>Proceed</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6DepositAsset.data.instructions) {
    return (
      <Modal
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <Modal.Heading>SEP-6 Deposit Instructions</Modal.Heading>

        <Modal.Body>
          <p>Transfer your offchain funds to the following destination:</p>
          <div className="vertical-spacing">
            {Object.entries(sep6DepositAsset.data.instructions).map(
              ([key, instr]) => (
                <div key={key}>
                  <label>{instr.description}</label>
                  <span>{instr.value}</span>
                </div>
              ),
            )}
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  return null;
};
