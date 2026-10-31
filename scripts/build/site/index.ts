import type { Plugin } from "vite-plus";
import { siteDocument } from "./document";

export function staticSiteDocument(): Plugin {
  return {
    name: "static-site-document",
    transformIndexHtml: {
      order: "pre",
      handler: (html) => html.replace("<!-- site-content -->", siteDocument()),
    },
  };
}
