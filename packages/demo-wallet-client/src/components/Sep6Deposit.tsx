import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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

import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { KycField, KycFieldInput } from "components/KycFieldInput";

import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { resetActiveAssetAction } from "ducks/activeAsset";
import {
  getDepositQuoteAction,
  initSep6DepositFlowAction,
  initSep6DepositFlowWithQuoteAction,
  resetSep6DepositAction,
  sep6DepositPriceAction,
  submitSep6CustomerInfoFieldsAction,
  submitSep6DepositAction,
} from "ducks/sep6Deposit";
import { ActionStatus } from "types/types";

export const Sep6Deposit = () => {
  const { sep6Deposit } = useRedux("sep6Deposit");
  const {
    data: {
      depositAssets,
      infoFields,
      buyAsset,
      minAmount,
      maxAmount,
      depositResponse,
    },
  } = sep6Deposit;

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
  const [selectedDepositAsset, setSelectedDepositAsset] = useState("");
  const [selectedDepositAssetCountryCode, setSelectedDepositAssetCountryCode] =
    useState("");
  const [selectedDepositAssetSellMethod, setSelectedDepositAssetSellMethod] =
    useState("");
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(true);

  const dispatch: AppDispatch = useDispatch();

  const supportsQuotes = depositAssets && depositAssets.length > 0;

  const depositTypeChoices = useMemo(
    () => infoFields.type.choices || [],
    [infoFields.type.choices],
  );

  useEffect(() => {
    if (sep6Deposit.status === ActionStatus.NEEDS_INPUT) {
      setFormData({
        amount: "",
        depositType: {
          type: depositTypeChoices[0],
        },
        infoFields: {},
        customerFields: {},
      });
    }
  }, [sep6Deposit.status, depositTypeChoices, dispatch]);

  const resetLocalState = () => {
    setFormData(formInitialState);
    setSelectedDepositAsset("");
    setSelectedDepositAssetCountryCode("");
    setSelectedDepositAssetSellMethod("");
  };

  const handleClose = () => {
    dispatch(resetSep6DepositAction());
    dispatch(resetActiveAssetAction());
    resetLocalState();
  };

  const handleSubmit = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    dispatch(submitSep6DepositAction());
  };

  const handleSubmitWithQuote = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    const { id, sell_asset, sell_amount, buy_asset } =
      sep6Deposit.data.quote || {};

    if (!(id && buy_asset && sell_asset && sell_amount)) {
      return;
    }

    dispatch(
      initSep6DepositFlowWithQuoteAction({
        ...formData,
        amount: sell_amount,
        quoteId: id,
        destinationAssetCode: buy_asset.split(":")[1],
        sourceAsset: sell_asset,
      }),
    );
  };

  const handleGetPrice = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    if (buyAsset) {
      dispatch(
        sep6DepositPriceAction({
          sellAsset: selectedDepositAsset,
          buyAsset: buyAsset,
          sellAmount: formData.amount || "0",
          sellDeliveryMethod: selectedDepositAssetSellMethod,
          countryCode: selectedDepositAssetCountryCode,
        }),
      );
    }
  };

  const handleGetQuote = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();

    if (buyAsset) {
      dispatch(
        getDepositQuoteAction({
          sellAsset: selectedDepositAsset,
          buyAsset: buyAsset,
          sellAmount: formData.amount || "0",
          sellDeliveryMethod: selectedDepositAssetSellMethod,
          countryCode: selectedDepositAssetCountryCode,
        }),
      );
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = event.target;

    const updatedState = {
      ...formData,
      [id]: value.toString(),
    };

    setFormData(updatedState);
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

  const handleSubmitCustomerInfo = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    event.preventDefault();
    dispatch(submitSep6CustomerInfoFieldsAction(formData.customerFields));
  };

  const renderMinMaxAmount = () => {
    if (minAmount === 0 && maxAmount === 0) {
      return null;
    }

    return `Min: ${minAmount} | Max: ${maxAmount}`;
  };

  const renderDepositAssets = () => {
    if (!supportsQuotes) {
      return null;
    }

    return (
      <>
        <Heading3>Deposit Asset and Method</Heading3>
        <div>
          {depositAssets.map((a) => (
            <div key={a.asset}>
              <RadioButton
                key={a.asset}
                name="deposit-asset"
                id={a.asset}
                label={a.asset.split(":")[1]}
                onChange={() => {
                  setSelectedDepositAsset(a.asset);
                  setSelectedDepositAssetCountryCode("");
                  setSelectedDepositAssetSellMethod("");
                }}
                checked={a.asset === selectedDepositAsset}
              />

              <div className="Sep6Selection">
                {a.sell_delivery_methods?.map((d, index) => (
                  <RadioButton
                    key={`${a.asset}-${index}-${d.name}`}
                    name="deposit-asset-sell-method"
                    id={`${a.asset}-${index}-${d.name}`}
                    label={`${d.name} - ${d.description}`}
                    disabled={a.asset !== selectedDepositAsset}
                    onChange={() => {
                      setSelectedDepositAssetSellMethod(d.name);
                    }}
                    checked={
                      a.asset === selectedDepositAsset &&
                      d.name === selectedDepositAssetSellMethod
                    }
                  />
                ))}
              </div>

              {a.country_codes?.length && a.country_codes.length > 1 ? (
                <div className="Sep6Selection">
                  <div className="Sep6Selection__label">Country code</div>
                  {a.country_codes?.map((c) => (
                    <RadioButton
                      key={c}
                      name="deposit-asset-country-code"
                      id={c}
                      label={c}
                      onChange={() => {
                        setSelectedDepositAssetCountryCode(c);
                      }}
                      checked={c === selectedDepositAssetCountryCode}
                    />
                  ))}
                </div>
              ) : null}
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
          disabled={!(selectedDepositAsset && selectedDepositAssetSellMethod)}
        >
          Continue
        </Button>
      );
    }

    return (
      <Button
        onClick={(event) => {
          event.preventDefault();
          dispatch(initSep6DepositFlowAction({ ...formData }));
        }}
      >
        Submit
      </Button>
    );
  };

  // Initial deposit modal
  if (sep6Deposit.status === ActionStatus.NEEDS_INPUT) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>Updated SEP-6 Deposit Info</Modal.Heading>
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
            {Object.entries(infoFields || {}).map(([id, input]) =>
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

          {renderDepositAssets()}
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
  if (sep6Deposit.status === ActionStatus.PRICE && sep6Deposit.data.price) {
    const { price, sell_amount, buy_amount, total_price, fee } =
      sep6Deposit.data.price;

    const priceItems = [
      {
        label: "Price",
        value: price,
      },
      {
        label: "Sell amount",
        value: sell_amount,
      },
      {
        label: "Buy amount",
        value: buy_amount,
      },
      {
        label: "Total price",
        value: total_price,
      },
      {
        label: "Fee",
        value: fee.total,
      },
    ];

    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>Price Estimate</Modal.Heading>

        <Modal.Body>
          <p>
            These prices are indicative. The actual price will be calculated at
            conversion time once the Anchor receives the funds.
          </p>

          <div className="AnchorQuote">
            {priceItems.map((item) => (
              <div key={item.label} className="AnchorQuote__item">
                <label>{item.label}</label>
                <div className="AnchorQuote__item__value">{item.value}</div>
              </div>
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleGetQuote}>Proceed</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Quote modal
  if (
    sep6Deposit.status === ActionStatus.ANCHOR_QUOTES &&
    sep6Deposit.data.quote
  ) {
    const {
      id,
      price,
      expires_at,
      sell_asset,
      sell_amount,
      buy_asset,
      buy_amount,
      total_price,
      fee,
    } = sep6Deposit.data.quote;

    const quoteItems = [
      {
        label: "ID",
        value: id,
      },
      {
        label: "Price",
        value: price,
      },
      {
        label: "Expires at",
        value: expires_at,
      },
      {
        label: "Sell asset",
        value: sell_asset,
      },
      {
        label: "Sell amount",
        value: sell_amount,
      },
      {
        label: "Buy asset",
        value: buy_asset,
      },
      {
        label: "Buy amount",
        value: buy_amount,
      },
      {
        label: "Total price",
        value: total_price,
      },
      {
        label: "Fee",
        value: fee.total,
      },
    ];

    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Deposit Quote</Modal.Heading>
        <Modal.Body>
          <p>
            These prices are indicative. The actual price will be calculated at
            conversion time once the Anchor receives the funds.
          </p>

          <div className="AnchorQuote">
            {quoteItems.map((item) => (
              <div key={item.label} className="AnchorQuote__item">
                <label>{item.label}</label>
                <div className="AnchorQuote__item__value">{item.value}</div>
              </div>
            ))}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmitWithQuote}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Deposit.status === ActionStatus.CAN_PROCEED) {
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
          <Button onClick={handleSubmit}>Proceed</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Deposit.status === ActionStatus.NEEDS_KYC) {
    return (
      <Modal visible onClose={handleClose} parentId={CSS_MODAL_PARENT_ID}>
        <Modal.Heading>SEP-6 Customer Info</Modal.Heading>
        <Modal.Body>
          {Object.keys(sep6Deposit.data.customerFields).length ? (
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
            {Object.entries(sep6Deposit.data.customerFields || {}).map(
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
          <Button onClick={handleSubmitCustomerInfo}>Submit</Button>
          <Button onClick={handleClose} variant={Button.variant.secondary}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  if (sep6Deposit.status === ActionStatus.KYC_DONE) {
    return (
      <Modal
        visible={isInfoModalVisible}
        onClose={() => setIsInfoModalVisible(false)}
        parentId={CSS_MODAL_PARENT_ID}
      >
        <Modal.Heading>SEP-6 Deposit</Modal.Heading>

        <Modal.Body>
          <p>Submit the deposit.</p>
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  return null;
};
