import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  TextLink,
  Icon,
  InfoBlock,
  Modal,
  CopyText,
} from "@stellar/design-system";
import { resetStoreAction } from "config/store";
import { getCurrentSessionParams } from "demo-wallet-shared/build/helpers/getCurrentSessionParams";
import { SearchParams, StringObject } from "types/types";
import { contractAccountSelector } from "../ducks/contractAccount";

export const SignOutModal = ({ onClose }: { onClose: () => void }) => {
  const [sessionParams, setSessionParams] = useState<SearchParams[]>([]);
  const { isAuthenticated } = useSelector(contractAccountSelector);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setSessionParams(getCurrentSessionParams());
  }, []);

  const handleSignOut = () => {
    dispatch(resetStoreAction());
    navigate({
      pathname: "/",
    });
    onClose();
  };

  const getMessageText = () => {
    const paramText: StringObject = {
      [SearchParams.ASSET_OVERRIDES]: "home domain overrides",
      [SearchParams.UNTRUSTED_ASSETS]: "untrusted assets",
      [SearchParams.CLAIMABLE_BALANCE_SUPPORTED]: "claimable balance supported",
    };

    return sessionParams.map((s) => paramText[s]).join(", ");
  };

  const accountSignOutBody =
    <Modal.Body>
      <p>
        You can reload the account using your secret key or press back in your
        browser to sign back in.
      </p>

      {sessionParams.length > 0 && (
        <InfoBlock variant={InfoBlock.variant.warning}>
          <p>
            {`You have session data (${getMessageText()}) that will be lost when you sign out. You can copy the URL to save it.`}
          </p>
          <div className="SessionParamsWrapper">
            <CopyText
              textToCopy={window.location.toString()}
              tooltipPosition={CopyText.tooltipPosition.RIGHT}
              showTooltip
            >
              <TextLink iconLeft={<Icon.Copy />}>Copy URL</TextLink>
            </CopyText>
          </div>
        </InfoBlock>
      )}
    </Modal.Body>

  const contractAccountSignOutBody =
    <Modal.Body>
      <p>Thanks for using the Demo Wallet contract account.</p>
      <p>Come back anytime by reconnecting with the same passkey.</p>
    </Modal.Body>

  return (
    <>
      { isAuthenticated ? contractAccountSignOutBody : accountSignOutBody }
      <Modal.Footer>
        <Button onClick={handleSignOut}>Sign out</Button>
        <Button variant={Button.variant.secondary} onClick={onClose}>
          Go back
        </Button>
      </Modal.Footer>
    </>
  );
};
