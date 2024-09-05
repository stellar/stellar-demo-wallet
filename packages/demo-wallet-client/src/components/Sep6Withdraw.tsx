import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DetailsTooltip,
  Heading3,
  Input,
  Modal,
  RadioButton,
  Select,
  TextLink,
} from "@stellar/design-system";
import { useDispatch } from "react-redux";

import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { shortenStellarKey } from "demo-wallet-shared/build/helpers/shortenStellarKey";

import { ErrorMessage } from "components/ErrorMessage";
import { KycField, KycFieldInput } from "components/KycFieldInput";
import { Sep6PriceModal } from "components/Sep6PriceModal";
import { Sep6QuoteModal } from "components/Sep6QuoteModal";

import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import {
  getWithdrawQuoteAction,
  initSep6WithdrawFlow,
  initSep6WithdrawFlowWithQuoteAction,
  resetSep6WithdrawAction,
  sep6WithdrawPriceAction,
  submitSep6WithdrawAction,
  submitSep6WithdrawCustomerInfoFieldsAction,
} from "ducks/sep6Withdraw";
import { resetActiveAssetAction } from "ducks/activeAsset";

import { ActionStatus } from "types/types";

export const Sep6Withdraw = () => {
  const { sep6Withdraw } = useRedux("sep6Withdraw");
  const {
    data: {
      withdrawResponse,
      withdrawAssets,
      minAmount,
      maxAmount,
      sellAsset,
      transactionResponse,
    },
  } = sep6Withdraw;

  interface FormData {
    amount?: string;
    withdrawType: {
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
    withdrawType: {
      type: "",
    },
    infoFields: {},
    customerFields: {},
  };

  const [formData, setFormData] = useState<FormData>(formInitialState);
  const [selectedWithdrawAsset, setSelectedWithdrawAsset] = useState("");
  const [selectedWithdrawBuyMethod, setSelectedWithdrawBuyMethod] =
    useState("");
  const [
    selectedWithdrawAssetCountryCode,
    setSelectedWithdrawAssetCountryCode,
  ] = useState("");
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(true);

  const dispatch: AppDispatch = useDispatch();

  const supportsQuotes = withdrawAssets && withdrawAssets.length > 0;

  const withdrawTypes = useMemo(
    () => sep6Withdraw.data.withdrawTypes?.types || { fields: {} },
    [sep6Withdraw],
  );

  const [activeWithdrawType, setActiveWithdrawType] = useState(
    Object.keys(withdrawTypes)[0],
  );

  const withdrawTypesArr = useMemo(
    () => Object.entries(withdrawTypes),
    [withdrawTypes],
  );

  useEffect(() => {
    if (sep6Withdraw.status === ActionStatus.NEEDS_INPUT) {
      const initialWithdrawType = withdrawTypesArr[0][0];
      setFormData({
        amount: "",
        withdrawType: {
          type: initialWithdrawType,
        },
        infoFields: {},
        customerFields: {},
      });
      setActiveWithdrawType(initialWithdrawType);
    }
  }, [sep6Withdraw.status, withdrawTypesArr, dispatch]);

  const resetLocalState = () => {
    setFormData(formInitialState);
    setSelectedWithdrawAsset("");
    setSelectedWithdrawAssetCountryCode("");
    setSelectedWithdrawBuyMethod("");
    setIsInfoModalVisible(true);
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

  const handleAmountFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      [id]: value.toString(),
    };

    setFormData(updatedState);
  };

  const handleCustomerFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value } = event.target;

    let fields = { ...formData.customerFields };

    if (value) {
      fields[id] = value;
    } else if (fields[id]) {
      delete fields[id];
    }

    const updatedState = {
      ...formData,
      customerFields: fields,
    };

    setFormData(updatedState);
  };

  const handleGetPrice = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    if (sellAsset) {
      dispatch(
        sep6WithdrawPriceAction({
          sellAsset: sellAsset,
          buyAsset: selectedWithdrawAsset,
          sellAmount: formData.amount || "0",
          buyDeliveryMethod: selectedWithdrawBuyMethod,
          countryCode: selectedWithdrawAssetCountryCode,
        }),
      );
    }
  };

  const handleGetQuote = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    if (sellAsset) {
      dispatch(
        getWithdrawQuoteAction({
          sellAsset: sellAsset,
          buyAsset: selectedWithdrawAsset,
          sellAmount: formData.amount || "0",
          buyDeliveryMethod: selectedWithdrawBuyMethod,
          countryCode: selectedWithdrawAssetCountryCode,
        }),
      );
    }
  };

  const handleSubmitWithQuote = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    const { id, sell_asset, sell_amount, buy_asset } =
      sep6Withdraw.data.quote || {};

    if (!(id && buy_asset && sell_asset && sell_amount)) {
      return;
    }

    dispatch(
      initSep6WithdrawFlowWithQuoteAction({
        ...formData,
        amount: sell_amount,
        quoteId: id,
        destinationAsset: buy_asset,
        sourceAssetCode: sell_asset.split(":")[1],
      }),
    );
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    dispatch(submitSep6WithdrawAction(formData.amount || "0"));
  };

  const handleSubmitCustomerInfo = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(
      submitSep6WithdrawCustomerInfoFieldsAction(formData.customerFields),
    );
  };

  const renderMinMaxAmount = () => {
    if (minAmount === 0 && maxAmount === 0) {
      return null;
    }

    return `Min: ${minAmount} | Max: ${maxAmount}`;
  };

  const renderWithdrawAssets = () => {
    if (!supportsQuotes) {
      return null;
    }

    return (
      <>
        <Heading3>Withdraw Asset and Method</Heading3>
        <div>
          {withdrawAssets.map((a) => (
            <div key={a.asset}>
              <RadioButton
                key={a.asset}
                name="withdraw-asset"
                id={a.asset}
                label={a.asset.split(":")[1]}
                onChange={() => {
                  setSelectedWithdrawAsset(a.asset);
                  setSelectedWithdrawAssetCountryCode("");
                  setSelectedWithdrawBuyMethod("");
                }}
                checked={a.asset === selectedWithdrawAsset}
              />

              <div className="Sep6Selection">
                {a.buy_delivery_methods?.map((d, index) => (
                  <RadioButton
                    key={`${a.asset}-${index}-${d.name}`}
                    name="withdraw-asset-sell-method"
                    id={`${a.asset}-${index}-${d.name}`}
                    label={`${d.name} - ${d.description}`}
                    disabled={a.asset !== selectedWithdrawAsset}
                    onChange={() => {
                      setSelectedWithdrawBuyMethod(d.name);
                    }}
                    checked={
                      a.asset === selectedWithdrawAsset &&
                      d.name === selectedWithdrawBuyMethod
                    }
                  />
                ))}
              </div>

              <div className="Sep6Selection">
                <div className="Sep6Selection__label">Country code</div>
                {a.country_codes?.map((c) => (
                  <RadioButton
                    key={c}
                    name="withdraw-asset-country-code"
                    id={c}
                    label={c}
                    onChange={() => {
                      setSelectedWithdrawAssetCountryCode(c);
                    }}
                    checked={c === selectedWithdrawAssetCountryCode}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderSubmitButton = () => {
    if (supportsQuotes) {
      return (
        <Button
          onClick={handleGetPrice}
          disabled={!(selectedWithdrawAsset && selectedWithdrawBuyMethod)}
        >
          Continue
        </Button>
      );
    }

    return (
      <Button
        onClick={(event) => {
          event.preventDefault();
          dispatch(initSep6WithdrawFlow({ ...formData }));
        }}
      >
        Submit
      </Button>
    );
  };

  // Initial withdraw modal
  if (sep6Withdraw.status === ActionStatus.NEEDS_INPUT) {
    if (
      sep6Withdraw.data.requiredCustomerInfoUpdates &&
      sep6Withdraw.data.requiredCustomerInfoUpdates.length
    ) {
      return (
        <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
          <Modal.Heading>SEP-6 Update Customer Info</Modal.Heading>
          <Modal.Body>
            <div className="vertical-spacing">
              {sep6Withdraw.data.requiredCustomerInfoUpdates.map((input) => (
                <KycFieldInput
                  id={input.id}
                  input={input as KycField}
                  onChange={handleCustomerFieldChange}
                  isRequired={true}
                />
              ))}
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
          <>
            <Input
              id="amount"
              label="Amount to Withdraw (optional)"
              onChange={handleAmountFieldChange}
              value={formData.amount}
              note={renderMinMaxAmount()}
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

          {renderWithdrawAssets()}

          <ErrorMessage message={sep6Withdraw.errorString} />
        </Modal.Body>

        <Modal.Footer>
          {renderSubmitButton()}
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Show price
  if (sep6Withdraw.status === ActionStatus.PRICE && sep6Withdraw.data.price) {
    return (
      <Sep6PriceModal
        priceItem={sep6Withdraw.data.price}
        onClose={handleClose}
        onProceed={handleGetQuote}
      />
    );
  }

  // Quote modal
  if (
    sep6Withdraw.status === ActionStatus.ANCHOR_QUOTES &&
    sep6Withdraw.data.quote
  ) {
    return (
      <Sep6QuoteModal
        type="withdrawal"
        quote={sep6Withdraw.data.quote}
        onClose={handleClose}
        onSubmit={handleSubmitWithQuote}
      />
    );
  }

  if (sep6Withdraw.status === ActionStatus.CAN_PROCEED) {
    const isRequiredCustomerInfo = Boolean(
      sep6Withdraw.data.requiredCustomerInfoUpdates,
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
          <Button onClick={handleSubmit}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Withdraw.status === ActionStatus.NEEDS_KYC) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Customer Info</Modal.Heading>
        <Modal.Body>
          {Object.keys(sep6Withdraw.data.fields).length ? (
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
            {Object.entries(sep6Withdraw.data.fields || {}).map(
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
          <Button onClick={handleSubmitCustomerInfo}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Withdraw.status === ActionStatus.KYC_DONE) {
    return (
      <Modal
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <Modal.Heading>SEP-6 Withdrawal</Modal.Heading>

        <Modal.Body>
          <p>Submit the withdrawal.</p>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Withdraw.status === ActionStatus.SUCCESS) {
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
              Amount Withdrawn: {transactionResponse.amount_in}{" "}
              {transactionResponse.amount_in_asset.split(":")[1]}
              <p>
                {transactionResponse.amount_fee && (
                  <>Fee: {transactionResponse.amount_fee}</>
                )}
              </p>
              <p>
                {transactionResponse.amount_out && (
                  <strong>
                    Total Amount Out: {transactionResponse.amount_out}{" "}
                    {transactionResponse.amount_out_asset.split(":")[1]}
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
