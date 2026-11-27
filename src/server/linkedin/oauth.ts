import "server-only";

import type { LinkedInConfig } from "./config";

/** LinkedIn OAuth 2.0 (3-legged, authorization code). */

export function authorizeUrl(cfg: LinkedInConfig, redirectUri: string, state: string) {
  const q = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    state,
    scope: cfg.scopes,
  });
  return `${cfg.oauthUrl}/authorization?${q}`;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

async function tokenRequest(cfg: LinkedInConfig, body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(`${cfg.oauthUrl}/accessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: cfg.clientId, client_secret: cfg.clientSecret }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const json = (await res.json().catch(() => ({}))) as TokenResponse & { error?: string; error_description?: string };
  if (!res.ok || !json.access_token) {
    // Never include secrets/tokens in errors.
    throw new Error(`LinkedIn token request failed (${res.status}): ${json.error ?? ""} ${json.error_description ?? ""}`.trim());
  }
  return json;
}

export const exchangeCode = (cfg: LinkedInConfig, code: string, redirectUri: string) =>
  tokenRequest(cfg, { grant_type: "authorization_code", code, redirect_uri: redirectUri });

export const refreshAccessToken = (cfg: LinkedInConfig, refreshToken: string) =>
  tokenRequest(cfg, { grant_type: "refresh_token", refresh_token: refreshToken });
