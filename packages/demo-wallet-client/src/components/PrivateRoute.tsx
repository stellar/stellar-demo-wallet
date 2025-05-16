import { Navigate, useLocation } from "react-router-dom";
import { useRedux } from "hooks/useRedux";
import React from "react";

export const PrivateRoute = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const { account, contractAccount } = useRedux("account", "contractAccount");
  const location = useLocation();

  if (account.isAuthenticated || contractAccount.isAuthenticated) {
    return children;
  }

  // If we're not authenticated, redirect to home
  return (
    <Navigate
      to={{
        pathname: "/",
        search: location.search,
      }}
    />
  );
};
