import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Heading2, TextLink } from "@stellar/design-system";
import { LOG_MESSAGE_EVENT } from "constants/settings";
import { clearLogsAction, logAction } from "ducks/logs";
import { useRedux } from "hooks/useRedux";
import { LogItem } from "types/types.d";

export const Logs = () => {
  const { logs } = useRedux("logs");
  const dispatch = useDispatch();

  useEffect(() => {
    const onLogEventMessage = (e: any) => {
      const { type, title, body } = e.detail;

      dispatch(
        logAction({
          type,
          title,
          body: JSON.stringify(body),
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
            {logs.items.map((log: LogItem, index: number) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={`${index}-${log.type}`} className="LogItem">
                <strong>{log.type}:</strong> {log.title} - {log.body}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
