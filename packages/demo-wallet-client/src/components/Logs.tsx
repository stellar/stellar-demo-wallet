import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Layout, TextLink } from "@stellar/design-system";

import { LogItem } from "components/LogItem";
import { LOG_MESSAGE_EVENT } from "demo-wallet-shared/build/constants/settings";
import { clearLogsAction, addLogAction } from "ducks/logs";
import { useRedux } from "hooks/useRedux";
import { AppDispatch } from "config/store";
import { LogItemProps } from "types/types";

export const Logs = () => {
  const { account, logs } = useRedux("account", "logs");
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const onLogEventMessage = (e: any) => {
      const { timestamp, type, title, body } = e.detail;

      dispatch(
        addLogAction({
          timestamp,
          type,
          title,
          body: JSON.stringify(body),
        }),
      );
    };

    document.addEventListener(LOG_MESSAGE_EVENT, onLogEventMessage);

    return () => {
      document.removeEventListener(LOG_MESSAGE_EVENT, onLogEventMessage);
    };
  }, [dispatch]);

  const logsToMarkdown = (logItems: LogItemProps[]) => {
    const heading = `# Stellar Demo Wallet logs\n\n`;
    const date = `${new Date()}\n\n`;
    const url = `[URL](${window.location.toString()})\n\n`;
    const divider = `---\n\n`;
    const contentHeader = `${heading}${date}${url}${divider}`;

    return logItems.reduce((result, log, index) => {
      const isLastItem = index === logItems.length - 1;
      let content = `**${log.type}:** ${log.title}\n`;
      let body = log.body ? JSON.parse(`${log.body}`) : null;

      if (body) {
        body = typeof body === "string" ? body : JSON.stringify(body, null, 2);
        content += `\n\`\`\`javascript\n${body}\n\`\`\`\n`;
      }

      if (!isLastItem) {
        content += "\n";
      }

      return `${result}${content}`;
    }, contentHeader);
  };

  const handleDownload = () => {
    if (!logs.items.length) {
      return;
    }

    const filename = `stellar-dw-logs-${Date.now()}.md`;
    const content = logsToMarkdown(logs.items);
    const element = document.createElement("a");

    element.setAttribute(
      "href",
      `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`,
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!account.isAuthenticated) {
    return (
      <div className="SplitContainer Logs">
        <div className="Logs__content">
          <div className="Logs__empty">
            Operation logs will appear here once a transaction begins
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="SplitContainer Logs">
      <div className="Logs__container">
        <div className="Logs__content">
          <Layout.Inset>
            <div className="Logs__wrapper">
              {logs.items.length ? (
                logs.items.map((log: LogItemProps, index: number) => (
                  <LogItem
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${log.timestamp}-${index}`}
                    variant={log.type}
                    title={log.title}
                    body={log.body}
                  />
                ))
              ) : (
                <p>No logs to show</p>
              )}
            </div>
          </Layout.Inset>
        </div>
      </div>

      <div className="Logs__footer">
        <Layout.Inset>
          <TextLink onClick={handleDownload} disabled={!logs.items.length}>
            Download logs
          </TextLink>

          <TextLink
            onClick={() => dispatch(clearLogsAction())}
            disabled={!logs.items.length}
          >
            Clear logs
          </TextLink>
        </Layout.Inset>
      </div>
    </div>
  );
};
