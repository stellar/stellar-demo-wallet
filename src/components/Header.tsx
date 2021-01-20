import React from "react";
import { useDispatch } from "react-redux";
import { ProjectLogo, TextButton } from "@stellar/design-system";
import { resetAccountAction } from "ducks/account";
import { useRedux } from "hooks/useRedux";

export const Header = () => {
  const { account } = useRedux("account");
  const dispatch = useDispatch();

  const handleSignOut = () => {
    dispatch(resetAccountAction());
  };

  return (
    <div className="Header">
      <div className="Inset">
        <ProjectLogo title="Demo Wallet" />
        {account.isAuthenticated && (
          <TextButton onClick={handleSignOut}>Sign out</TextButton>
        )}
      </div>
    </div>
  );
};
