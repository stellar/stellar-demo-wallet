import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Heading2, TextLink } from "@stellar/design-system";

import { LogItem } from "components/LogItem";
import { LOG_MESSAGE_EVENT } from "constants/settings";
import { clearLogsAction, logAction } from "ducks/logs";
import { useRedux } from "hooks/useRedux";
import { LogItemProps } from "types/types.d";

export const Logs = () => {
  const { logs } = useRedux("logs");
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

  return (
    <div className="SplitContainer Logs">
      <div className="ContentWrapper">
        <div className="Inset">
          <Heading2>Logs</Heading2>
          <TextLink onClick={() => dispatch(clearLogsAction())}>
            Clear logs
          </TextLink>

          <div className="LogsContent">
            {logs.items.map((log: LogItemProps) => (
              <LogItem
                key={log.timestamp}
                variant={log.type}
                title={log.title}
                body={log.body}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
