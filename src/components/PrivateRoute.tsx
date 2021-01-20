import { Route, Redirect, RouteProps } from "react-router-dom";
import { useRedux } from "hooks/useRedux";

export const PrivateRoute = ({ children, ...rest }: RouteProps) => {
  const { account } = useRedux("account");

  return (
    <Route
      {...rest}
      render={() => (account.isAuthenticated ? children : <Redirect to="/" />)}
    />
  );
};
