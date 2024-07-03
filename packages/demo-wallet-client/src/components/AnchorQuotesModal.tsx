import { useState } from "react";
import { useDispatch } from "react-redux";
import BigNumber from "bignumber.js";
import { Button, Loader, Modal, RadioButton } from "@stellar/design-system";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { useRedux } from "hooks/useRedux";
import {
  fetchSep38QuotesPricesAction,
  postSep38QuoteAction,
} from "ducks/sep38Quotes";
import { AppDispatch } from "config/store";
import { ActionStatus, AnchorBuyAsset } from "types/types";

interface AnchorQuotesModalProps {
  token: string;
  context: "sep31" | "sep6";
  isDeposit: boolean;
  onClose: () => void;
  onSubmit: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    quoteId?: string,
    buyAssset?: string,
    sellAsset?: string,
  ) => void;
}

type QuoteAsset = {
  asset: string;
  sellDeliveryMethod?: string;
  buyDeliveryMethod?: string;
  countryCode?: string;
};

export const AnchorQuotesModal = ({
  token,
  context,
  isDeposit,
  onClose,
  onSubmit,
}: AnchorQuotesModalProps) => {
  const { sep38Quotes } = useRedux("sep38Quotes");
  const { data, status, errorString: errorMessage } = sep38Quotes;

  const [quoteAsset, setQuoteAsset] = useState<QuoteAsset>();
  const [assetBuyDeliveryMethod, setAssetBuyDeliveryMethod] =
    useState<string>();
  const [assetSellDeliveryMethod, setAssetSellDeliveryMethod] =
    useState<string>();
  const [assetCountryCode, setAssetCountryCode] = useState<string>();
  const [assetPrice, setAssetPrice] = useState<string>();

  const dispatch: AppDispatch = useDispatch();

  const calculateTotal = (amount: string | number, rate: string | number) => {
    // TODO: Do we need to use precision from asset?
    return new BigNumber(amount).div(rate).toFixed(2);
  };

  const getRenderAssets = () => {
    let selectedAsset: string | undefined;

    if (context === "sep31") {
      selectedAsset = isDeposit ? data.sellAsset : data.buyAsset;
    } else if (context === "sep6") {
      selectedAsset = isDeposit ? data.buyAsset : data.sellAsset;
    }

    // Exclude selected asset from quote assets
    return selectedAsset
      ? data.assets.filter((a) => a.asset !== selectedAsset)
      : [];
  };

  const renderAssets = getRenderAssets();

  const handleGetAssetRates = () => {
    if (context === "sep31") {
      if (data.serverUrl && data.sellAsset && data.amount) {
        dispatch(
          fetchSep38QuotesPricesAction({
            token,
            anchorQuoteServerUrl: data.serverUrl,
            options: {
              sellAsset: data.sellAsset,
              sellAmount: data.amount,
              buyDeliveryMethod: assetBuyDeliveryMethod,
              sellDeliveryMethod: assetSellDeliveryMethod,
              countryCode: assetCountryCode,
            },
          }),
        );
      }
    } else if (context === "sep6") {
      const sellAsset = isDeposit ? quoteAsset?.asset : data.sellAsset;

      if (data.serverUrl && data.amount && sellAsset) {
        dispatch(
          fetchSep38QuotesPricesAction({
            token,
            anchorQuoteServerUrl: data.serverUrl,
            options: {
              sellAsset,
              sellAmount: data.amount,
              buyDeliveryMethod: assetBuyDeliveryMethod,
              sellDeliveryMethod: assetSellDeliveryMethod,
              countryCode: assetCountryCode,
            },
          }),
        );
      }
    }
  };

  const handleGetQuote = () => {
    if (context === "sep31") {
      if (
        data.serverUrl &&
        data.sellAsset &&
        data.amount &&
        quoteAsset?.asset
      ) {
        dispatch(
          postSep38QuoteAction({
            token,
            anchorQuoteServerUrl: data.serverUrl,
            sell_asset: data.sellAsset,
            buy_asset: quoteAsset.asset,
            sell_amount: data.amount,
            buy_delivery_method: assetBuyDeliveryMethod,
            sell_delivery_method: assetSellDeliveryMethod,
            country_code: assetCountryCode,
            context,
          }),
        );
      }
    } else if (context === "sep6") {
      if (isDeposit) {
        if (
          data.serverUrl &&
          data.buyAsset &&
          data.amount &&
          quoteAsset?.asset
        ) {
          dispatch(
            postSep38QuoteAction({
              token,
              anchorQuoteServerUrl: data.serverUrl,
              sell_asset: quoteAsset.asset,
              buy_asset: data.buyAsset,
              sell_amount: data.amount,
              buy_delivery_method: assetBuyDeliveryMethod,
              sell_delivery_method: assetSellDeliveryMethod,
              country_code: assetCountryCode,
              context,
            }),
          );
        }
      } else {
        if (data.serverUrl && data.sellAsset && quoteAsset?.asset) {
          dispatch(
            postSep38QuoteAction({
              token,
              anchorQuoteServerUrl: data.serverUrl,
              sell_asset: data.sellAsset,
              buy_asset: quoteAsset.asset,
              sell_amount: data.amount,
              buy_delivery_method: assetBuyDeliveryMethod,
              sell_delivery_method: assetSellDeliveryMethod,
              country_code: assetCountryCode,
              context,
            }),
          );
        }
      }
    }
  };

  const renderContent = () => {
    if (status === ActionStatus.SUCCESS) {
      if (data.quote) {
        const {
          id,
          price,
          expires_at,
          sell_asset,
          buy_asset,
          sell_amount,
          buy_amount,
        } = data.quote;

        return (
          <>
            <Modal.Body>
              <p>Quote details</p>

              <div>
                <div>
                  <label>ID</label>
                  <div>{id}</div>
                </div>

                <div>
                  <label>Price</label>
                  <div>{price}</div>
                </div>

                <div>
                  <label>Expires at</label>
                  <div>{expires_at}</div>
                </div>

                <div>
                  <label>Sell asset</label>
                  <div>{sell_asset}</div>
                </div>

                <div>
                  <label>Sell amount</label>
                  <div>{sell_amount}</div>
                </div>

                <div>
                  <label>Buy asset</label>
                  <div>{buy_asset}</div>
                </div>

                <div>
                  <label>Buy amount</label>
                  <div>{buy_amount}</div>
                </div>

                <div>
                  <label></label>
                  <div>{}</div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                onClick={(
                  event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                ) =>
                  onSubmit(
                    event,
                    data.quote?.id,
                    data.quote?.buy_asset,
                    data.quote?.sell_asset,
                  )
                }
              >
                Submit
              </Button>
            </Modal.Footer>
          </>
        );
      }

      if (data.prices?.length > 0 && quoteAsset?.asset) {
        let sellAssetCode: string | undefined;
        let buyAssetCode: string | undefined;
        let prices: AnchorBuyAsset[] = [];

        if (context === "sep31") {
          sellAssetCode = data.sellAsset?.split(":")[1];
          buyAssetCode = quoteAsset?.asset.split(":")[1];
          prices = data.prices.filter((p) => p.asset === quoteAsset.asset);
        }

        if (context === "sep6") {
          if (isDeposit) {
            sellAssetCode = data.buyAsset?.split(":")[1];
            buyAssetCode = quoteAsset?.asset.split(":")[1];
            prices = data.prices.filter((p) => p.asset === data.buyAsset);
          } else {
            sellAssetCode = data.sellAsset?.split(":")[1];
            buyAssetCode = quoteAsset?.asset.split(":")[1];
            prices = data.prices.filter((p) => p.asset === quoteAsset.asset);
          }
        }

        return (
          <>
            <Modal.Body>
              <p>Rates (not final)</p>

              <div>
                {prices.map((p) => (
                  <RadioButton
                    key={`${p.asset}-${p.price}`}
                    name="anchor-asset-price"
                    id={`${p.asset}-${p.price}`}
                    label={p.price}
                    onChange={() => {
                      setAssetPrice(p.price);
                    }}
                  />
                ))}
              </div>

              {data.amount && assetPrice ? (
                <div>{`Estimated total of ${calculateTotal(
                  data.amount,
                  assetPrice,
                )} ${buyAssetCode} for ${data.amount} ${sellAssetCode}`}</div>
              ) : null}
            </Modal.Body>

            <Modal.Footer>
              <Button disabled={!assetPrice} onClick={handleGetQuote}>
                Get quote
              </Button>
            </Modal.Footer>
          </>
        );
      }

      if (renderAssets.length > 0) {
        return (
          <>
            <Modal.Body>
              <div>
                {/* TODO: handle no assets case */}
                {/* TODO: could pre-selected asset if there is only one */}
                {renderAssets.map((a) => (
                  <div key={a.asset}>
                    <RadioButton
                      key={a.asset}
                      name="anchor-asset"
                      id={a.asset}
                      label={a.asset.split(":")[1]}
                      onChange={() => {
                        setQuoteAsset({
                          asset: a.asset,
                        });
                        setAssetCountryCode("");
                        setAssetBuyDeliveryMethod(undefined);
                        setAssetSellDeliveryMethod(undefined);
                      }}
                      checked={a.asset === quoteAsset?.asset}
                    />

                    {/* TODO: Better UI */}
                    <div style={{ paddingLeft: 20 }}>
                      {a.country_codes && a.country_codes.length > 0 ? (
                        <>
                          <div>Country codes</div>
                          <div>
                            {a.country_codes?.map((c) => (
                              <RadioButton
                                key={`anchor-${a.asset}-country-${c}`}
                                name={`anchor-${a.asset}-country`}
                                id={`anchor-${a.asset}-country-${c}`}
                                label={c}
                                disabled={a.asset !== quoteAsset?.asset}
                                onChange={() => {
                                  setAssetCountryCode(c);
                                }}
                                checked={
                                  a.asset === quoteAsset?.asset &&
                                  c === assetCountryCode
                                }
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {a.buy_delivery_methods &&
                      a.buy_delivery_methods.length > 0 ? (
                        <>
                          <div>Buy delivery methods</div>
                          <div>
                            {a.buy_delivery_methods?.map((b) => (
                              <RadioButton
                                key={`anchor-${a.asset}-delivery-${b.name}`}
                                name={`anchor-${a.asset}-delivery`}
                                id={`anchor-${a.asset}-delivery-${b.name}`}
                                label={`${b.name} - ${b.description}`}
                                disabled={a.asset !== quoteAsset?.asset}
                                onChange={() => {
                                  setAssetBuyDeliveryMethod(b.name);
                                }}
                                checked={
                                  a.asset === quoteAsset?.asset &&
                                  b.name === assetBuyDeliveryMethod
                                }
                              />
                            ))}
                          </div>
                        </>
                      ) : null}

                      {a.sell_delivery_methods &&
                      a.sell_delivery_methods.length > 0 ? (
                        <>
                          <div>Sell delivery methods</div>
                          <div>
                            {a.sell_delivery_methods?.map((b) => (
                              <RadioButton
                                key={`anchor-${a.asset}-delivery-sell-${b.name}`}
                                name={`anchor-${a.asset}-delivery-sell`}
                                id={`anchor-${a.asset}-delivery-sell-${b.name}`}
                                label={`${b.name} - ${b.description}`}
                                disabled={a.asset !== quoteAsset?.asset}
                                onChange={() => {
                                  setAssetSellDeliveryMethod(b.name);
                                }}
                                checked={
                                  a.asset === quoteAsset?.asset &&
                                  b.name === assetSellDeliveryMethod
                                }
                              />
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button disabled={!quoteAsset} onClick={handleGetAssetRates}>
                Get rates
              </Button>
            </Modal.Footer>
          </>
        );
      }
    }

    if (status === ActionStatus.ERROR) {
      return (
        <Modal.Body>
          <p className="error">{errorMessage}</p>
        </Modal.Body>
      );
    }

    return null;
  };

  return (
    <Modal visible onClose={onClose} parentId={CSS_MODAL_PARENT_ID}>
      <Modal.Heading>Anchor Quotes</Modal.Heading>

      {status === ActionStatus.PENDING ? <Loader /> : renderContent()}
    </Modal>
  );
};
