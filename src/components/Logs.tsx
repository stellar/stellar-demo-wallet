import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { TextButton } from "@stellar/design-system";

import { LogItem } from "components/LogItem";
import { LOG_MESSAGE_EVENT } from "constants/settings";
import { clearLogsAction, logAction } from "ducks/logs";
import { useRedux } from "hooks/useRedux";
import { LogItemProps } from "types/types.d";

export const Logs = () => {
  const { account, logs } = useRedux("account", "logs");
  const dispatch = useDispatch();

  useEffect(() => {
    const onLogEventMessage = (e: any) => {
      const { timestamp, type, title, body } = e.detail;

      dispatch(
        logAction({
          timestamp,
          type,
          title,
          body,
        }),
      );
    };

    document.addEventListener(LOG_MESSAGE_EVENT, onLogEventMessage);

    return document.removeEventListener(
      LOG_MESSAGE_EVENT,
      onLogEventMessage,
      true,
    );
  }, [dispatch]);

  if (!account.isAuthenticated) {
    return (
      <div className="SplitContainer Logs">
        <div className="ContentWrapper">
          <div className="EmptyLogsContent">Your logs will show up here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="SplitContainer Logs">
      <div className="LogsWrapper">
        <div className="ContentWrapper">
          <div className="Inset">
            <div className="LogsContent">
              {logs.items.length ? (
                logs.items.map((log: LogItemProps) => (
                  <LogItem
                    key={log.timestamp}
                    variant={log.type}
                    title={log.title}
                    body={log.body}
                  />
                ))
              ) : (
                <p>No logs to show</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="LogsFooter">
        <div className="Inset">
          <TextButton
            onClick={() => dispatch(clearLogsAction())}
            disabled={!logs.items.length}
          >
            Clear logs
          </TextButton>
        </div>
      </div>
    </div>
  );
};
