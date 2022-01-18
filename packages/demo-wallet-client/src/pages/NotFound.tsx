import { useNavigate, useLocation } from "react-router-dom";
import { Button, Heading1, Layout, Eyebrow } from "@stellar/design-system";

export const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate({ pathname: "/", search: location.search });
  };

  return (
    <Layout.Inset>
      <div className="NotFoundPage">
        <Eyebrow>Error 404</Eyebrow>
        <Heading1>Sorry, that page couldn’t be found.</Heading1>
        <p>Have you tried turning it off and on again?</p>
        <Button onClick={handleBack}>Go back</Button>
      </div>
    </Layout.Inset>
  );
};
