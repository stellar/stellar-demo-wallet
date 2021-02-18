import ReactJson from "react-json-view";
import { ReactComponent as IconArrowLeft } from "assets/icons/arrow-left.svg";
import { ReactComponent as IconArrowRight } from "assets/icons/arrow-right.svg";
import { ReactComponent as IconBubble } from "assets/icons/bubble.svg";
import { ReactComponent as IconError } from "assets/icons/error.svg";
import { LogType } from "types/types.d";
import "./styles.scss";

const LogItemIcon = {
  instruction: <IconBubble />,
  error: <IconError />,
  request: <IconArrowRight />,
  response: <IconArrowLeft />,
};

interface LogItemProps {
  title: string;
  variant: LogType;
  body?: string | object;
}

const theme = {
  light: {
    base00: "#fff",
    base01: "#fff",
    base02: "#fff",
    base03: "#000",
    base04: "#000",
    base05: "#000",
    base06: "#000",
    base07: "#000",
    base08: "#000",
    base09: "#000",
    base0A: "#000",
    base0B: "#000",
    base0C: "#000",
    base0D: "#000",
    base0E: "#000",
    base0F: "#000",
  },
  dark: {
    base00: "#292d3e",
    base01: "#292d3e",
    base02: "#292d3e",
    base03: "#fbfaf7",
    base04: "#fbfaf7",
    base05: "#fbfaf7",
    base06: "#fbfaf7",
    base07: "#fbfaf7",
    base08: "#fbfaf7",
    base09: "#fbfaf7",
    base0A: "#fbfaf7",
    base0B: "#fbfaf7",
    base0C: "#fbfaf7",
    base0D: "#fbfaf7",
    base0E: "#fbfaf7",
    base0F: "#fbfaf7",
  },
};

export const LogItem = ({ title, variant, body }: LogItemProps) => (
  <div className={`LogItem ${variant}`}>
    <div className="LogItemHeader">
      <div className="LogItemIcon">{LogItemIcon[variant]}</div>
      <div className="LogItemTitle">{title}</div>
    </div>
    {body && (
      <div className="LogItemBody">
        {typeof body === "object" ? (
          <ReactJson
            src={body}
            collapseStringsAfterLength={15}
            displayDataTypes={false}
            collapsed={1}
            theme={
              variant === LogType.INSTRUCTION || variant === LogType.ERROR
                ? theme.light
                : theme.dark
            }
          />
        ) : (
          body
        )}
      </div>
    )}
  </div>
);
