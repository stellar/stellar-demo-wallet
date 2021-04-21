import { captureMessage as sentryCaptureMessage } from "@sentry/browser";
import { LOG_MESSAGE_EVENT } from "constants/settings";
import { LogType, LogItemProps } from "types/types.d";

const dispatchLog = (detail: LogItemProps) => {
  document.dispatchEvent(
    new CustomEvent(LOG_MESSAGE_EVENT, {
      detail,
    }),
  );
};

export const log = {
  request: ({
    title,
    body = "",
  }: {
    title: string;
    body?: string | object;
  }) => {
    console.log("🚀", title, body);
    dispatchLog({
      timestamp: new Date().getTime(),
      type: LogType.REQUEST,
      title,
      body,
    });
  },

  response: ({
    title,
    body = "",
  }: {
    title: string;
    body?: string | object;
  }) => {
    console.log("✅", title, body);
    dispatchLog({
      timestamp: new Date().getTime(),
      type: LogType.RESPONSE,
      title,
      body,
    });
  },

  instruction: ({
    title,
    body = "",
  }: {
    title: string;
    body?: string | object;
  }) => {
    console.info("💬", title, body);
    dispatchLog({
      timestamp: new Date().getTime(),
      type: LogType.INSTRUCTION,
      title,
      body,
    });
  },

  error: ({ title, body = "" }: { title: string; body?: string | object }) => {
    sentryCaptureMessage(title);
    console.error(title, body);
    dispatchLog({
      timestamp: new Date().getTime(),
      type: LogType.ERROR,
      title,
      body,
    });
  },
};
