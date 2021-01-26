import { useState } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";
import { AddAsset } from "components/AddAsset";
import { Balance } from "components/Balance";
import { CopyWithTooltip } from "components/CopyWithTooltip";
import { SendPayment } from "components/SendPayment";
import { UntrustedBalance } from "components/UntrustedBalance";
import { fetchAccountAction } from "ducks/account";
import { useRedux } from "hooks/useRedux";

export const Account = () => {
  const { account } = useRedux("account");
  const [isSendPaymentVisible, setIsSendPaymentVisible] = useState(false);
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);
  const [isAddAssetVisible, setIsAddAssetVisible] = useState(false);

  const dispatch = useDispatch();

  const handleRefreshAccount = () => {
    if (account.data?.id) {
      dispatch(
        fetchAccountAction({
          publicKey: account.data.id,
          secretKey: account.secretKey,
        }),
      );
    }
  };

  const handleSendPayment = () => {
    setIsSendPaymentVisible(true);
  };

  const handleSendPaymentCancel = () => {
    setIsSendPaymentVisible(false);
  };

  if (!account.data?.id) {
    return null;
  }

  return (
    <div className="Inset">
      {/* Balances */}
      <Balance onSend={handleSendPayment} />
      <UntrustedBalance />

      {/* Send payment */}
      {/* TODO: pre-fill fields from selected asset */}
      {isSendPaymentVisible && (
        <SendPayment onCancel={handleSendPaymentCancel} />
      )}

      {/* Copy keys */}
      <div style={{ display: "flex" }}>
        <CopyWithTooltip copyText={account.data.id}>
          <TextButton>Copy Address</TextButton>
        </CopyWithTooltip>
        <CopyWithTooltip copyText={account.secretKey}>
          <TextButton>Copy Secret</TextButton>
        </CopyWithTooltip>
      </div>

      {/* Refresh account */}
      <TextButton onClick={handleRefreshAccount}>Refresh account</TextButton>

      {/* Add asset */}
      <div>
        <TextButton onClick={() => setIsAddAssetVisible(!isAddAssetVisible)}>
          Add asset
        </TextButton>
        {isAddAssetVisible && <AddAsset />}
      </div>

      {/* Account details */}
      <div>
        <TextButton
          onClick={() => setIsAccountDetailsVisible(!isAccountDetailsVisible)}
        >{`${
          isAccountDetailsVisible ? "Hide" : "Show"
        } Account Details`}</TextButton>

        {isAccountDetailsVisible && (
          <pre>{JSON.stringify(account.data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};
