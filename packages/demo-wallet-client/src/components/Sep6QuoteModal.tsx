import { Button, Modal } from "@stellar/design-system";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { AnchorQuote } from "types/types";

type Sep6QuoteModalProps = {
  quote: AnchorQuote;
  onClose: () => void;
  onSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const Sep6QuoteModal = ({
  quote,
  onClose,
  onSubmit,
}: Sep6QuoteModalProps) => {
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
  } = quote;

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
    <Modal visible onClose={onClose} parentId={CSS_MODAL_PARENT_ID}>
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
        <Button onClick={onSubmit}>Submit</Button>
        <Button onClick={onClose} variant={Button.variant.secondary}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
