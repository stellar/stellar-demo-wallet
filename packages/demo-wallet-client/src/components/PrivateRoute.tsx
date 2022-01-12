import { Navigate, useLocation } from "react-router-dom";
import { useRedux } from "hooks/useRedux";

export const PrivateRoute = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const { account } = useRedux("account");
  const location = useLocation();

  return account.isAuthenticated ? (
    children
  ) : (
    <Navigate
      to={{
        pathname: "/",
        search: location.search,
      }}
    />
  );
};
