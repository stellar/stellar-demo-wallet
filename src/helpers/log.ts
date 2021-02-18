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
  request: ({ url, body }: { url: string; body?: string | object }) => {
    const type = LogType.REQUEST;

    console.log(type.toUpperCase(), url, body);
    dispatchLog({ timestamp: new Date().getTime(), type, title: url, body });
  },

  response: ({ url, body }: { url: string; body?: string | object }) => {
    const type = LogType.RESPONSE;

    console.log(type.toUpperCase(), url, body);
    dispatchLog({ timestamp: new Date().getTime(), type, title: url, body });
  },

  instruction: ({ title, body }: { title: string; body?: string | object }) => {
    const type = LogType.INSTRUCTION;

    console.log(type.toUpperCase(), title, body);
    dispatchLog({ timestamp: new Date().getTime(), type, title, body });
  },

  error: ({ title, body }: { title: string; body?: string | object }) => {
    const type = LogType.ERROR;

    console.error(type.toUpperCase(), title, body);
    dispatchLog({ timestamp: new Date().getTime(), type, title, body });
  },
};
