import { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Button,
  ButtonVariant,
  TextButton,
  IconCopy,
  InfoBlock,
  InfoBlockVariant,
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
      <div className="ModalBody">
        <p>
          You can reload the account using your secret key or press back in your
          browser to sign back in.
        </p>

        {sessionParams.length > 0 && (
          <InfoBlock variant={InfoBlockVariant.warning}>
            <p>
              {`You have session data (${getMessageText()}) that will be lost when you sign out. You can copy the URL to save it.`}
            </p>
            <div className="SessionParamsWrapper">
              <CopyWithTooltip
                copyText={window.location.toString()}
                tooltipPosition={TooltipPosition.right}
              >
                <TextButton icon={<IconCopy />}>Copy URL</TextButton>
              </CopyWithTooltip>
            </div>
          </InfoBlock>
        )}
      </div>

      <div className="ModalButtonsFooter">
        <Button onClick={handleSignOut}>Sign out</Button>
        <Button variant={ButtonVariant.secondary} onClick={onClose}>
          Go back
        </Button>
      </div>
    </>
  );
};
