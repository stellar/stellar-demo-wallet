import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  Input,
  Select,
  TextLink,
  Modal,
  Heading3,
  DetailsTooltip,
} from "@stellar/design-system";
import { ErrorMessage } from "components/ErrorMessage";
import { KycField, KycFieldInput } from "components/KycFieldInput";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  resetSep6WithdrawAction,
  submitSep6WithdrawFields,
  sep6WithdrawAction,
  submitSep6WithdrawCustomerInfoFields,
} from "ducks/sep6WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";
import { AppDispatch } from "config/store";
import { ActionStatus, AnyObject } from "types/types";

export const Sep6Withdraw = () => {
  const { sep6WithdrawAsset } = useRedux("sep6WithdrawAsset");
  const {
    data: { assetCode, transactionResponse, withdrawResponse },
  } = sep6WithdrawAsset;

  interface FormData {
    withdrawType: {
      type: string;
    };
    customerFields: AnyObject;
    infoFields: AnyObject;
  }

  const formInitialState: FormData = {
    withdrawType: {
      type: "",
    },
    customerFields: {},
    infoFields: {},
  };

  const [formData, setFormData] = useState<FormData>(formInitialState);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(true);

  const dispatch: AppDispatch = useDispatch();

  const withdrawTypes = useMemo(
    () => sep6WithdrawAsset.data.withdrawTypes?.types || { fields: {} },
    [sep6WithdrawAsset],
  );

  const [activeWithdrawType, setActiveWithdrawType] = useState(
    Object.keys(withdrawTypes)[0],
  );

  const withdrawTypesArr = useMemo(
    () => Object.entries(withdrawTypes),
    [withdrawTypes],
  );

  useEffect(() => {
    if (sep6WithdrawAsset.status === ActionStatus.NEEDS_INPUT) {
      const initialWithdrawType = withdrawTypesArr[0][0];
      setFormData({
        withdrawType: {
          type: initialWithdrawType,
        },
        customerFields: {},
        infoFields: {},
      });
      setActiveWithdrawType(initialWithdrawType);
    }
  }, [sep6WithdrawAsset.status, withdrawTypesArr, dispatch]);

  const resetLocalState = () => {
    setFormData(formInitialState);
  };

  const handleClose = () => {
    dispatch(resetSep6WithdrawAction());
    dispatch(resetActiveAssetAction());
    resetLocalState();
  };

  const handleWithdrawTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const { value } = event.target;
    setActiveWithdrawType(value);
    setFormData({
      ...formData,
      withdrawType: {
        type: value,
      },
    });
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

  const handleFieldsSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6WithdrawFields({ ...formData }));
  };

  const handleAmountFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { value } = event.target;

    setWithdrawAmount(value);
  };

  const handleAmountSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(sep6WithdrawAction(withdrawAmount));
  };

  const handleSubmitCustomerInfo = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6WithdrawCustomerInfoFields(formData.customerFields));
  };

  if (sep6WithdrawAsset.status === ActionStatus.NEEDS_KYC) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Customer Info</Modal.Heading>
        <Modal.Body>
          {Object.keys(sep6WithdrawAsset.data.fields).length ? (
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
            {Object.entries(sep6WithdrawAsset.data.fields || {}).map(
              ([field, fieldInfo]) => (
                <KycFieldInput
                  id={field}
                  input={fieldInfo as KycField}
                  onChange={handleCustomerFieldChange}
                />
              ),
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleFieldsSubmit}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6WithdrawAsset.status === ActionStatus.NEEDS_INPUT) {
    if (
      sep6WithdrawAsset.data.requiredCustomerInfoUpdates &&
      sep6WithdrawAsset.data.requiredCustomerInfoUpdates.length
    ) {
      return (
        <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
          <Modal.Heading>SEP-6 Update Customer Info</Modal.Heading>
          <Modal.Body>
            <div className="vertical-spacing">
              {sep6WithdrawAsset.data.requiredCustomerInfoUpdates.map(
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
        <Modal.Heading>SEP-6 Withdrawal Info</Modal.Heading>

        <Modal.Body>
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
            <Select
              label="Withdrawal Type"
              id="withdrawal-type"
              onChange={handleWithdrawTypeChange}
            >
              {withdrawTypesArr.map(([type]) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            {Object.entries(
              withdrawTypes[activeWithdrawType]?.fields || {},
            ).map(([field, fieldInfo]) => (
              <Input
                key={field}
                id={field}
                label={(fieldInfo as any)?.description}
                required
                onChange={handleInfoFieldChange}
              />
            ))}
          </div>
          <ErrorMessage message={sep6WithdrawAsset.errorString} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleFieldsSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6WithdrawAsset.status === ActionStatus.CAN_PROCEED) {
    const isRequiredCustomerInfo = Boolean(
      sep6WithdrawAsset.data.requiredCustomerInfoUpdates,
    );

    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>
          {isRequiredCustomerInfo ? "Complete Withdrawal" : "Payment Sending"}
        </Modal.Heading>

        <Modal.Body>
          {withdrawResponse.account_id ? (
            <div className="vertical-spacing">
              <strong>Sending Payment To: </strong>
              {shortenStellarKey(withdrawResponse.account_id)}
            </div>
          ) : null}

          {!isRequiredCustomerInfo ? (
            <>
              <Input
                id="withdraw-amount"
                label="Amount to Withdraw"
                required
                onChange={handleAmountFieldChange}
              />
              {withdrawResponse.min_amount || withdrawResponse.max_amount ? (
                <div className="vertical-spacing">
                  {withdrawResponse.min_amount && (
                    <p>
                      <strong>Min Amount: </strong>
                      {withdrawResponse.min_amount}
                    </p>
                  )}
                  {withdrawResponse.max_amount && (
                    <p>
                      <strong>Max Amount: </strong>
                      {withdrawResponse.max_amount}
                    </p>
                  )}
                </div>
              ) : null}
            </>
          ) : null}

          {withdrawResponse.id && (
            <div className="vertical-spacing">
              <strong>Transaction ID: </strong>
              {withdrawResponse.id}
            </div>
          )}

          {withdrawResponse.extra_info?.message && (
            <div className="vertical-spacing">
              {withdrawResponse.extra_info.message}
            </div>
          )}

          {withdrawResponse.memo_type && (
            <div className="vertical-spacing">
              <strong>Memo Type: </strong>

              {withdrawResponse.memo_type}
            </div>
          )}

          {withdrawResponse.memo && (
            <div className="vertical-spacing">
              <strong>Memo: </strong>

              {withdrawResponse.memo}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleAmountSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6WithdrawAsset.status === ActionStatus.SUCCESS) {
    return (
      <Modal
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <Modal.Heading>SEP-6 Withdrawal Completed</Modal.Heading>

        <Modal.Body>
          {transactionResponse.to && (
            <div className="vertical-spacing">
              <strong>Account Withdrawn To: </strong>
              <p>{transactionResponse.to}</p>
              <p>{transactionResponse.external_extra_text}</p>
            </div>
          )}

          {transactionResponse.more_info_url && (
            <div className="vertical-spacing">
              <strong>More Info: </strong>
              <p>{transactionResponse.more_info_url}</p>
            </div>
          )}
          {transactionResponse.amount_in && (
            <div className="vertical-spacing">
              Amount Withdrawn: {transactionResponse.amount_in}
              <p>
                {transactionResponse.amount_fee && (
                  <>Fee: {transactionResponse.amount_fee}</>
                )}
              </p>
              <p>
                {transactionResponse.amount_out && (
                  <strong>
                    Total Amount Out: {transactionResponse.amount_out}{" "}
                    {assetCode}
                  </strong>
                )}
              </p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    );
  }

  return null;
};
