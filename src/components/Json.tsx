import ReactJson, { ReactJsonViewProps } from "react-json-view";

export const Json = ({ src }: ReactJsonViewProps) => (
  <ReactJson
    src={src}
    collapseStringsAfterLength={15}
    displayDataTypes={true}
    collapsed={false}
    theme={{
      base00: "#fff",
      base01: "#fff",
      base02: "#fff",
      base03: "#000",
      base04: "#3e1bdb",
      base05: "#000",
      base06: "#000",
      base07: "#000",
      base08: "#000",
      base09: "#000",
      base0A: "#000",
      base0B: "#000",
      base0C: "#000",
      base0D: "#3e1bdb",
      base0E: "#3e1bdb",
      base0F: "#3e1bdb",
    }}
  />
);
