import ReactJson, { ReactJsonViewProps } from "@microlink/react-json-view";

const defaultTheme = {
  base00: "var(--pal-background-primary)",
  base01: "var(--pal-background-primary)",
  base02: "var(--pal-background-primary)",
  base03: "var(--pal-text-primary)",
  base04: "var(--pal-text-link)",
  base05: "var(--pal-text-primary)",
  base06: "var(--pal-text-primary)",
  base07: "var(--pal-text-primary)",
  base08: "var(--pal-text-primary)",
  base09: "var(--pal-text-primary)",
  base0A: "var(--pal-text-primary)",
  base0B: "var(--pal-text-primary)",
  base0C: "var(--pal-text-primary)",
  base0D: "var(--pal-text-link)",
  base0E: "var(--pal-text-link)",
  base0F: "var(--pal-text-link)",
};

export const Json = ({
  src,
  collapseStringsAfterLength = 15,
  displayDataTypes = true,
  collapsed = false,
  theme = defaultTheme,
}: ReactJsonViewProps) => (
  <>
    <ReactJson
      src={src}
      collapseStringsAfterLength={collapseStringsAfterLength}
      displayDataTypes={displayDataTypes}
      collapsed={collapsed}
      theme={theme}
    />
  </>
);
