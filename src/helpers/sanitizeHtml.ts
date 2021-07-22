import parse from "html-react-parser";
import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string) =>
  // eslint-disable-next-line @typescript-eslint/naming-convention
  parse(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }));
