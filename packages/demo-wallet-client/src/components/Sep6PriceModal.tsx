import { Button, Modal } from "@stellar/design-system";
import { CSS_MODAL_PARENT_ID } from "demo-wallet-shared/build/constants/settings";
import { AnchorPriceItem } from "demo-wallet-shared/build/types/types";

type Sep6PriceModalProps = {
  priceItem: AnchorPriceItem;
  onClose: () => void;
  onProceed: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export const Sep6PriceModal = ({
  priceItem,
  onClose,
  onProceed,
}: Sep6PriceModalProps) => {
  const { price, sell_amount, buy_amount, total_price, fee } = priceItem;

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
    <Modal visible onClose={onClose} parentId={CSS_MODAL_PARENT_ID}>
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
        <Button onClick={onProceed}>Proceed</Button>
        <Button onClick={onClose} variant={Button.variant.secondary}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
