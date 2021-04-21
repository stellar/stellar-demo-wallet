import styled from "styled-components";
import { useHistory } from "react-router-dom";
import { Button, Heading1 } from "@stellar/design-system";

const WrapperEl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 2rem;
  padding-bottom: 2rem;
`;

const PageLabelEl = styled.div`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  text-align: center;
  text-transform: uppercase;
  margin-bottom: 1rem;
`;

export const NotFound = () => {
  const history = useHistory();

  const handleBack = () => {
    history.push({ pathname: "/", search: history.location.search });
  };

  return (
    <div className="Inset">
      <WrapperEl>
        <PageLabelEl>Error 404</PageLabelEl>
        <Heading1>Sorry, that page couldn’t be found.</Heading1>
        <p>Have you tried turning it off and on again?</p>
        <Button onClick={handleBack}>Back to Demo Wallet</Button>
      </WrapperEl>
    </div>
  );
};
