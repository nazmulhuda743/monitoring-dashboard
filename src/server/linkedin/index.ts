import "server-only";

import type { LinkedInSummary, SourceInfo } from "@/data/types";
import type { Store } from "../store";
import { mapPosts, mapSummary } from "./adapt";
import { createLinkedInClient, LinkedInError } from "./api";
import { LI_SNAPSHOT_KEY, LI_TOKEN_KEY, type LinkedInConfig, type StoredToken } from "./config";
import { exchangeCode, refreshAccessToken, type TokenResponse } from "./oauth";

export { linkedInConfigFromEnv } from "./config";

const DAY = 86400000;
const CONNECT: SourceInfo["action"] = { label: "connect", href: "/api/linkedin/connect", hint: "LinkedIn: click to connect the company page (one time)" };
const RECONNECT: SourceInfo["action"] = { label: "reconnect", href: "/api/linkedin/connect", hint: "LinkedIn: the login expired or is about to — click to reconnect (one click)" };

export type LinkedInResult =
  | { state: "live"; summary: LinkedInSummary; fetchedAt: number; action?: SourceInfo["action"] }
  | { state: "setup"; action: SourceInfo["action"]; summary?: LinkedInSummary }
  | { state: "error"; reason: string; summary?: LinkedInSummary };

interface Snapshot {
  fetchedAt: number;
  organizationId: string;
  summary: LinkedInSummary;
}

function toStored(t: TokenResponse, now: number, org: { id: string; name: string }, prev?: StoredToken): StoredToken {
  return {
    accessToken: t.access_token,
    expiresAt: now + t.expires_in * 1000,
    // Keep the old refresh token if LinkedIn didn't send a new one.
    refreshToken: t.refresh_token ?? prev?.refreshToken,
    refreshExpiresAt: t.refresh_token_expires_in ? now + t.refresh_token_expires_in * 1000 : prev?.refreshExpiresAt,
    scope: t.scope ?? prev?.scope,
    organizationId: org.id,
    organizationName: org.name,
    connectedAt: prev?.connectedAt ?? now,
  };
}

/** Fetch everything the dashboard shows (~4–5 API calls). */
async function fetchSummary(cfg: LinkedInConfig, token: StoredToken, now: number): Promise<LinkedInSummary> {
  const li = createLinkedInClient({ accessToken: token.accessToken, apiVersion: cfg.apiVersion, apiUrl: cfg.apiUrl });
  const id = token.organizationId;
  const dayStart = Math.floor(now / DAY) * DAY; // LinkedIn normalises ranges to UTC days
  const [org, posts, weekDays, followers] = await Promise.all([
    li.organization(id),
    li.posts(id, 10),
    li.pageStatsByDay(id, dayStart - 7 * DAY, dayStart + DAY),
    li.followers(id).catch((e) => {
      console.warn("[linkedin] follower count unavailable:", e instanceof Error ? e.message : e);
      return null; // nice-to-have; don't fail the whole refresh
    }),
  ]);
  const stats = posts.length ? await li.postStats(id, posts.map((p) => p.id)) : new Map();
  return mapSummary({ page: { id, name: org.name, vanityName: org.vanityName }, followers, posts: mapPosts(posts, stats), weekDays, now });
}

/**
 * The dashboard's LinkedIn data. Calls LinkedIn at most every
 * `cfg.refreshMinutes` (snapshot kept in the store, shared by all serverless
 * instances); renews the token when possible; otherwise asks to reconnect.
 */
export async function loadLinkedIn(cfg: LinkedInConfig, store: Store | null, now: number): Promise<LinkedInResult> {
  if (!store) {
    return {
      state: "setup",
      action: { label: "setup", href: "https://vercel.com/docs/redis", hint: "LinkedIn: connect a storage (Vercel → Storage → Upstash Redis) so the login can be saved" },
    };
  }
  let token = await store.get<StoredToken>(LI_TOKEN_KEY);
  if (!token) return { state: "setup", action: CONNECT };

  const snap = await store.get<Snapshot>(LI_SNAPSHOT_KEY);
  const stale = snap && snap.organizationId === token.organizationId ? snap.summary : undefined;

  // Renew an expired (or nearly expired) access token if LinkedIn gave us a refresh token.
  if (token.expiresAt - now < DAY && token.refreshToken && (token.refreshExpiresAt ?? Infinity) > now) {
    try {
      token = toStored(await refreshAccessToken(cfg, token.refreshToken), now, { id: token.organizationId, name: token.organizationName }, token);
      await store.set(LI_TOKEN_KEY, token);
    } catch (err) {
      console.error("[linkedin] token refresh failed:", err instanceof Error ? err.message : err);
    }
  }
  if (token.expiresAt <= now) return { state: "setup", action: RECONNECT, summary: stale };
  const expiringSoon = token.expiresAt - now < 7 * DAY && !token.refreshToken ? RECONNECT : undefined;

  if (snap && stale && now - snap.fetchedAt < cfg.refreshMinutes * 60000) {
    return { state: "live", summary: snap.summary, fetchedAt: snap.fetchedAt, action: expiringSoon };
  }

  try {
    const summary = await fetchSummary(cfg, token, now);
    await store.set(LI_SNAPSHOT_KEY, { fetchedAt: now, organizationId: token.organizationId, summary } satisfies Snapshot);
    return { state: "live", summary, fetchedAt: now, action: expiringSoon };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[linkedin] fetch failed:", msg);
    if (err instanceof LinkedInError && err.status === 401) return { state: "setup", action: RECONNECT, summary: stale };
    return { state: "error", reason: msg, summary: stale };
  }
}

/**
 * OAuth callback: swap the code for a token, check the person is an admin of
 * the right page, save. The page is LINKEDIN_ORGANIZATION_ID if set, else the
 * page connected before (so nobody can swap in another page), else the
 * admin's first page.
 */
export async function completeConnect(cfg: LinkedInConfig, store: Store, code: string, redirectUri: string, now: number) {
  const t = await exchangeCode(cfg, code, redirectUri);
  const li = createLinkedInClient({ accessToken: t.access_token, apiVersion: cfg.apiVersion, apiUrl: cfg.apiUrl });
  const adminOf = await li.adminOrganizationIds();
  const prev = await store.get<StoredToken>(LI_TOKEN_KEY);
  const wanted = cfg.organizationId ?? prev?.organizationId;
  const orgId = wanted ? adminOf.find((x) => x === wanted) : adminOf[0];
  if (!orgId) {
    throw new Error(
      wanted
        ? `This LinkedIn account is not an admin of page ${wanted}. Log in to LinkedIn as an admin of that page and try again.`
        : "This LinkedIn account doesn't administer any company page.",
    );
  }
  const org = await li.organization(orgId);
  const stored = toStored(t, now, { id: orgId, name: org.name }, prev?.organizationId === orgId ? prev : undefined);
  await store.set(LI_TOKEN_KEY, stored);
  await store.del(LI_SNAPSHOT_KEY); // fetch fresh data on next view
  return { organizationId: orgId, organizationName: org.name };
}
