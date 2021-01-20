import { useState } from "react";
import { useDispatch } from "react-redux";
import { Heading2, TextButton } from "@stellar/design-system";
import { CopyWithTooltip } from "components/CopyWithTooltip";
import { fetchAccountAction } from "ducks/account";
import { useRedux } from "hooks/useRedux";

export const Account = () => {
  const { account } = useRedux("account");
  const [isAccountDetailsVisible, setIsAccountDetailsVisible] = useState(false);

  const dispatch = useDispatch();
  let nativeBalance = 0;

  // TODO: handle all balances
  if (account.data) {
    nativeBalance = account.data.balances
      ? account.data.balances.native.total.toString()
      : 0;
  }

  const handleRefreshAccount = () => {
    dispatch(
      fetchAccountAction({
        publicKey: account.data.id,
        secretKey: account.secretKey,
      }),
    );
  };

  return (
    <div className="Inset">
      <Heading2>Balances</Heading2>
      <p>{`XLM: ${nativeBalance}`}</p>

      <div style={{ display: "flex", marginBottom: "1rem" }}>
        <CopyWithTooltip copyText={account.data.id}>
          <TextButton>Copy Address</TextButton>
        </CopyWithTooltip>
        <CopyWithTooltip copyText={account.secretKey}>
          <TextButton>Copy Secret</TextButton>
        </CopyWithTooltip>
      </div>

      <TextButton onClick={handleRefreshAccount}>Refresh account</TextButton>

      <TextButton
        onClick={() => setIsAccountDetailsVisible(!isAccountDetailsVisible)}
      >{`${
        isAccountDetailsVisible ? "Hide" : "Show"
      } Account Details`}</TextButton>

      {isAccountDetailsVisible && (
        <pre>{JSON.stringify(account.data, null, 2)}</pre>
      )}
    </div>
  );
};
