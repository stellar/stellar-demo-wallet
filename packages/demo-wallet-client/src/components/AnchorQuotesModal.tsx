import { useState } from "react";
import { useDispatch } from "react-redux";
import { Button, Loader, Modal, RadioButton } from "@stellar/design-system";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { useRedux } from "hooks/useRedux";
import { fetchSep38QuotesPricesAction } from "ducks/sep38Quotes";
import { ActionStatus } from "types/types.d";

interface AnchorQuotesModalProps {
  onClose: () => void;
}

type QuoteAsset = {
  asset: string;
  sellDeliveryMethod?: string;
  buyDeliveryMethod?: string;
  countryCode?: string;
};

export const AnchorQuotesModal = ({ onClose }: AnchorQuotesModalProps) => {
  const { sep38Quotes } = useRedux("sep38Quotes");
  const { data, status, errorString: errorMessage } = sep38Quotes;

  const [quoteAsset, setQuoteAsset] = useState<QuoteAsset>();
  const [assetBuyDeliveryMethod, setAssetBuyDeliveryMethod] =
    useState<string>();
  const [assetCountryCode, setAssetCountryCode] = useState<string>();
  const [assetPrice, setAssetPrice] = useState<string>();

  const dispatch = useDispatch();

  // Exclude sell asset from quote assets
  const renderAssets = data.sellAsset
    ? data.assets.filter((a) => a.asset !== data.sellAsset)
    : [];

  const handleGetAssetRates = () => {
    if (data.serverUrl && data.sellAsset && data.sellAmount) {
      dispatch(
        fetchSep38QuotesPricesAction({
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
    // TODO:
  };

  const renderContent = () => {
    if (status === ActionStatus.SUCCESS) {
      if (data.prices?.length > 0) {
        return (
          <>
            <Modal.Body>
              <div>
                {data.prices.map((p) => (
                  <RadioButton
                    key={`${p.asset}-${p.price}`}
                    name="anchor-asset-price"
                    id={`${p.asset}-${p.price}`}
                    label={`${p.price} ${p.asset.split(":")[1]}`}
                    onChange={() => {
                      setAssetPrice(p.price);
                    }}
                  />
                ))}
              </div>
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
                  <div>
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
                            <div>
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
                            </div>
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
