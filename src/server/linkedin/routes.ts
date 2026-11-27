import "server-only";

import type { NextRequest } from "next/server";
import { linkedInConfigFromEnv, type LinkedInConfig } from "./config";

export const STATE_COOKIE = "li_oauth_state";

/** Must exactly match a URL on the LinkedIn app's Auth tab. */
export const redirectUriFor = (cfg: LinkedInConfig, req: NextRequest) => cfg.redirectUri ?? `${req.nextUrl.origin}/api/linkedin/callback`;

export function requireConfig() {
  return linkedInConfigFromEnv();
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Small standalone page for connect errors/instructions (dark, matches the dashboard). */
export function messagePage(title: string, body: string, status = 400) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#05070A;color:#E8ECEF;font:15px/1.6 system-ui,sans-serif;padding:16px}
main{max-width:560px;padding:28px;border-radius:22px;background:linear-gradient(180deg,rgba(21,29,36,.74),rgba(11,16,21,.62));border:1px solid rgba(255,255,255,.075)}
h1{font-size:22px;margin:0 0 10px}p{color:#9BA4AE;margin:0 0 16px}a{color:#1FE0A0}</style></head>
<body><main><h1>${esc(title)}</h1><p>${esc(body)}</p><a href="/">← Back to the dashboard</a></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}
