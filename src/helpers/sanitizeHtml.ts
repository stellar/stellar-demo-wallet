import parse from "html-react-parser";
import DOMPurify from "dompurify";

export const sanitizeHtml = (html: string) =>
  parse(DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }));
