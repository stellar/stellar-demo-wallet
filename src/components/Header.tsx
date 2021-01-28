import React from "react";
import { useDispatch } from "react-redux";
import { ProjectLogo, TextButton } from "@stellar/design-system";
import { resetStoreAction } from "config/store";
import { useRedux } from "hooks/useRedux";

export const Header = () => {
  const { account } = useRedux("account");
  const dispatch = useDispatch();

  const handleSignOut = () => {
    dispatch(resetStoreAction());
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
