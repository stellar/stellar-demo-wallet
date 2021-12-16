import { Route, Redirect, RouteProps, useLocation } from "react-router-dom";
import { useRedux } from "hooks/useRedux";

export const PrivateRoute = ({ children, ...rest }: RouteProps) => {
  const { account } = useRedux("account");
  const location = useLocation();

  return (
    <Route
      {...rest}
      render={() =>
        account.isAuthenticated ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: "/",
              search: location.search,
            }}
          />
        )
      }
    />
  );
};
