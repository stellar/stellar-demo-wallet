import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Button,
  TextLink,
  Icon,
  InfoBlock,
  Modal,
} from "@stellar/design-system";
import { CopyWithTooltip, TooltipPosition } from "components/CopyWithTooltip";
import { resetStoreAction } from "config/store";
import { getCurrentSessionParams } from "helpers/getCurrentSessionParams";
import { SearchParams, StringObject } from "types/types.d";

export const SignOutModal = ({ onClose }: { onClose: () => void }) => {
  const [sessionParams, setSessionParams] = useState<SearchParams[]>([]);

  const dispatch = useDispatch();
  const history = useHistory();

  useEffect(() => {
    setSessionParams(getCurrentSessionParams());
  }, []);

  const handleSignOut = () => {
    dispatch(resetStoreAction());
    history.push({
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

  return (
    <>
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
              <CopyWithTooltip
                copyText={window.location.toString()}
                tooltipPosition={TooltipPosition.right}
              >
                <TextLink role="button" iconLeft={<Icon.Copy />}>
                  Copy URL
                </TextLink>
              </CopyWithTooltip>
            </div>
          </InfoBlock>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={handleSignOut}>Sign out</Button>
        <Button variant={Button.variant.secondary} onClick={onClose}>
          Go back
        </Button>
      </Modal.Footer>
    </>
  );
};
