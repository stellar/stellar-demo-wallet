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
import { ActionStatus } from "types/types";

interface AnchorQuotesModalProps {
  token: string;
  onClose: () => void;
  onSubmit: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    quoteId?: string,
    destinationAsset?: string,
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
  onClose,
  onSubmit,
}: AnchorQuotesModalProps) => {
  const { sep38Quotes } = useRedux("sep38Quotes");
  const { data, status, errorString: errorMessage } = sep38Quotes;

  const [quoteAsset, setQuoteAsset] = useState<QuoteAsset>();
  const [assetBuyDeliveryMethod, setAssetBuyDeliveryMethod] =
    useState<string>();
  const [assetCountryCode, setAssetCountryCode] = useState<string>();
  const [assetPrice, setAssetPrice] = useState<string>();

  const dispatch: AppDispatch = useDispatch();

  const calculateTotal = (amount: string | number, rate: string | number) => {
    // TODO: Do we need to use precision from asset?
    return new BigNumber(amount).div(rate).toFixed(2);
  };

  // Exclude sell asset from quote assets
  const renderAssets = data.sellAsset
    ? data.assets.filter((a) => a.asset !== data.sellAsset)
    : [];

  const handleGetAssetRates = () => {
    if (data.serverUrl && data.sellAsset && data.sellAmount) {
      dispatch(
        fetchSep38QuotesPricesAction({
          token,
          anchorQuoteServerUrl: data.serverUrl,
          options: {
            sellAsset: data.sellAsset,
            sellAmount: data.sellAmount,
            buyDeliveryMethod: assetBuyDeliveryMethod,
            countryCode: assetCountryCode,
          },
        }),
      );
    }
  };

  const handleGetQuote = () => {
    if (
      data.serverUrl &&
      data.sellAsset &&
      data.sellAmount &&
      quoteAsset?.asset
    ) {
      dispatch(
        postSep38QuoteAction({
          token,
          anchorQuoteServerUrl: data.serverUrl,
          sell_asset: data.sellAsset,
          buy_asset: quoteAsset.asset,
          sell_amount: data.sellAmount,
          buy_delivery_method: assetBuyDeliveryMethod,
          country_code: assetCountryCode,
          context: "sep31",
        }),
      );
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
                ) => onSubmit(event, data.quote?.id, data.quote?.buy_asset)}
              >
                Submit
              </Button>
            </Modal.Footer>
          </>
        );
      }

      if (data.prices?.length > 0) {
        const sellAssetCode = data.sellAsset?.split(":")[1];
        const buyAssetCode = quoteAsset?.asset.split(":")[1];

        return (
          <>
            <Modal.Body>
              <p>Rates (not final)</p>

              <div>
                {data.prices.map((p) => (
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

              {data.sellAmount && assetPrice ? (
                <div>{`Estimated total of ${calculateTotal(
                  data.sellAmount,
                  assetPrice,
                )} ${buyAssetCode} for ${
                  data.sellAmount
                } ${sellAssetCode}`}</div>
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
                      }}
                      checked={a.asset === quoteAsset?.asset}
                    />

                    {/* TODO: Better UI */}
                    <div style={{ paddingLeft: 20 }}>
                      <div>Country codes</div>
                      <div>
                        {a.country_codes?.map((c) => (
                          <RadioButton
                            key={c}
                            name={`anchor-${a.asset}-country`}
                            id={c}
                            label={c}
                            disabled={a.asset !== quoteAsset?.asset}
                            onChange={() => {
                              setAssetCountryCode(c);
                            }}
                            checked={c === assetCountryCode}
                          />
                        ))}
                      </div>

                      <>
                        <div>Buy delivery methods</div>
                        <div>
                          {a.buy_delivery_methods?.map((b) => (
                            <RadioButton
                              key={b.name}
                              name={`anchor-${a.asset}-delivery`}
                              id={b.name}
                              label={`${b.name} - ${b.description}`}
                              disabled={a.asset !== quoteAsset?.asset}
                              onChange={() => {
                                setAssetBuyDeliveryMethod(b.name);
                              }}
                              checked={b.name === assetBuyDeliveryMethod}
                            />
                          ))}
                        </div>
                      </>
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
