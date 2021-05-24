import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Button, InfoBlock, Input, Select } from "@stellar/design-system";
import { Heading2 } from "components/Heading";
import { Modal } from "components/Modal";
import { TextLink } from "components/TextLink";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  resetSep6WithdrawAction,
  submitSep6WithdrawFields,
  sep6WithdrawAction,
} from "ducks/sep6WithdrawAsset";
import { useRedux } from "hooks/useRedux";
import { ActionStatus, AnyObject } from "types/types.d";

export const Sep6Withdraw = () => {
  const { sep6WithdrawAsset } = useRedux("sep6WithdrawAsset");
  const {
    data: { withdrawResponse },
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
  const dispatch = useDispatch();

  const withdrawTypes = useMemo(
    () => sep6WithdrawAsset.data.withdrawTypes?.types || { fields: {} },
    [sep6WithdrawAsset],
  );

  const [activeWithdrawType, setActiveWithdrawType] = useState(
    Object.keys(withdrawTypes)[0],
  );

  const withdrawTypesArr = useMemo(() => Object.entries(withdrawTypes), [
    withdrawTypes,
  ]);

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

  useEffect(() => {
    if (sep6WithdrawAsset.status === ActionStatus.CAN_PROCEED) {
      dispatch(sep6WithdrawAction());
    }
  }, [sep6WithdrawAsset.status, dispatch]);

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
    dispatch(submitSep6WithdrawFields({ ...formData }));
  };

  const allFields = {
    amount: {
      description: "amount to withdraw",
    },
    ...(withdrawTypes[activeWithdrawType]?.fields
      ? withdrawTypes[activeWithdrawType].fields
      : {}),
  };

  if (sep6WithdrawAsset.status === ActionStatus.NEEDS_INPUT) {
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
            {Object.entries(allFields).map(([field, fieldInfo]) => (
              <Input
                key={field}
                id={field}
                label={fieldInfo?.description}
                required
                onChange={handleInfoFieldChange}
              />
            ))}
          </div>
          {Object.keys(sep6WithdrawAsset.data.fields).length ? (
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
            {Object.entries(sep6WithdrawAsset.data.fields || {}).map(
              ([field, fieldInfo]) => (
                <Input
                  key={field}
                  id={field}
                  label={fieldInfo?.description}
                  required
                  onChange={handleCustomerFieldChange}
                />
              ),
            )}
          </div>
        </div>
        {sep6WithdrawAsset.errorString && (
          <div className="ModalMessage error">
            <p>{sep6WithdrawAsset.errorString}</p>
          </div>
        )}

        <div className="ModalButtonsFooter">
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </Modal>
    );
  }

  if (sep6WithdrawAsset.status === ActionStatus.SUCCESS) {
    return (
      <Modal visible={true} onClose={handleClose}>
        <Heading2 className="ModalHeading">SEP-6 Withdraw Info</Heading2>

        <div className="ModalBody">
          <InfoBlock>
            <strong>Account ID: </strong>

            {withdrawResponse.account_id}
          </InfoBlock>

          {withdrawResponse.id && (
            <InfoBlock>
              <strong>ID: </strong>
              {withdrawResponse.id}
            </InfoBlock>
          )}
          {withdrawResponse.extra_info?.message && (
            <InfoBlock>{withdrawResponse.extra_info.message}</InfoBlock>
          )}

          {withdrawResponse.memo_type && (
            <InfoBlock>
              <strong>Memo Type: </strong>

              {withdrawResponse.memo_type}
            </InfoBlock>
          )}

          {withdrawResponse.memo && (
            <InfoBlock>
              <strong>Memo: </strong>

              {withdrawResponse.memo}
            </InfoBlock>
          )}

          {withdrawResponse.max_amount && (
            <InfoBlock>
              <strong>Max Amount: </strong>

              {withdrawResponse.max_amount}
            </InfoBlock>
          )}

          {withdrawResponse.min_amount && (
            <InfoBlock>
              <strong>Min Amount: </strong>

              {withdrawResponse.min_amount}
            </InfoBlock>
          )}
        </div>
      </Modal>
    );
  }

  return null;
};
