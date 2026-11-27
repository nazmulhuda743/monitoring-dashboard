import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LI_NOW, startFakeLinkedIn } from "@/test/fake-linkedin";
import { buildBrief } from "../brief";
import { getStore, type Store } from "../store";
import { engagementRate, mapLinkedInCheck } from "./adapt";
import { LI_SNAPSHOT_KEY, LI_TOKEN_KEY, linkedInConfigFromEnv, type StoredToken } from "./config";
import { completeConnect, loadLinkedIn } from "./index";

let fake: Awaited<ReturnType<typeof startFakeLinkedIn>>;
let env: Record<string, string>;
let store: Store;
const cfg = () => linkedInConfigFromEnv(env)!;
const MIN = 60000;
const DAY = 86400000;

beforeAll(async () => {
  fake = await startFakeLinkedIn();
});
afterAll(() => fake.server.close());
beforeEach(() => {
  env = {
    LINKEDIN_CLIENT_ID: "cid",
    LINKEDIN_CLIENT_SECRET: "csecret",
    LINKEDIN_API_URL: `${fake.url}/rest`,
    LINKEDIN_OAUTH_URL: `${fake.url}/oauth/v2`,
    STORE_FILE: join(mkdtempSync(join(tmpdir(), "li-")), "store.json"),
  };
  store = getStore(env)!;
  fake.calls.length = 0;
});
const connect = (code = "good") => completeConnect(cfg(), store, code, "https://dash.example/api/linkedin/callback", LI_NOW);

describe("connecting", () => {
  it("asks to set up storage first on Vercel without Redis", async () => {
    expect(getStore({ VERCEL: "1" })).toBeNull();
    const r = await loadLinkedIn(cfg(), null, LI_NOW);
    expect(r).toMatchObject({ state: "setup", action: { label: "setup" } });
  });

  it("asks to connect when there is no token yet", async () => {
    expect(await loadLinkedIn(cfg(), store, LI_NOW)).toMatchObject({ state: "setup", action: { label: "connect", href: "/api/linkedin/connect" } });
  });

  it("stores the token for the admin's page and picks the configured page", async () => {
    expect(await connect()).toEqual({ organizationId: "111", organizationName: "Caribglobal Data Services" });
    env.LINKEDIN_ORGANIZATION_ID = "222";
    expect(await connect()).toEqual({ organizationId: "222", organizationName: "YamaMi" });
    const t = await store.get<StoredToken>(LI_TOKEN_KEY);
    expect(t).toMatchObject({ accessToken: "li_at_1", organizationId: "222", expiresAt: LI_NOW + 5184000 * 1000 });
  });

  it("refuses a page the person doesn't administer", async () => {
    env.LINKEDIN_ORGANIZATION_ID = "999";
    await expect(connect()).rejects.toThrow("not an admin of page 999");
  });

  it("keeps the first connected page (nobody can swap in another page)", async () => {
    await connect(); // page 111
    await store.set(LI_TOKEN_KEY, { ...(await store.get<StoredToken>(LI_TOKEN_KEY))!, organizationId: "555" });
    await expect(connect()).rejects.toThrow("not an admin of page 555");
  });

  it("rejects a bad code", async () => {
    await expect(connect("nope")).rejects.toThrow("LinkedIn token request failed (400)");
  });
});

describe("loading page data", () => {
  it("maps posts, stats, weekly totals and followers", async () => {
    await connect();
    const r = await loadLinkedIn(cfg(), store, LI_NOW);
    expect(r.state).toBe("live");
    if (r.state !== "live") return;
    const { page, posts, week } = r.summary;
    expect(page).toEqual({ name: "Caribglobal Data Services", url: "https://www.linkedin.com/company/caribglobal-data-services/", followers: 4321 });
    // Draft hidden, newest first, hashtags cleaned, Curaçao dates.
    expect(posts.map((p) => [p.id, p.dow, p.day, p.text])).toEqual([
      ["urn:li:share:7001", "SUN", "22", "ISO 27001: why we are doing it #security"],
      ["urn:li:ugcPost:7002", "FRI", "20", "We are hiring support engineers in Santo Domingo"],
      ["urn:li:share:7004", "WED", "11", "Older post"],
    ]);
    expect(posts[0]).toMatchObject({ impressions: 2400, reactions: 80, comments: 12, shares: 8, engagement: 0.0667, url: "https://www.linkedin.com/feed/update/urn:li:share:7001/" });
    expect(posts[1].engagement).toBeCloseTo((30 + 45 + 5 + 10) / 1800);
    expect(posts[2]).toMatchObject({ impressions: 0, engagement: 0 }); // no activity → omitted by LinkedIn
    expect(week).toEqual({ posts: 2, impressions: 4200, reactions: 126, comments: 21, shares: 14, engagement: (84 + 126 + 21 + 14) / 4200 });
  });

  it("calls LinkedIn at most every 30 minutes (Development tier: ~500 calls/day)", async () => {
    await connect();
    fake.calls.length = 0; // count refresh calls only, not the one-time connect
    await loadLinkedIn(cfg(), store, LI_NOW);
    const first = fake.calls.length;
    expect(first).toBeLessThanOrEqual(6);
    fake.calls.length = 0;
    await loadLinkedIn(cfg(), store, LI_NOW + 29 * MIN);
    expect(fake.calls).toEqual([]);
    await loadLinkedIn(cfg(), store, LI_NOW + 31 * MIN);
    expect(fake.calls.length).toBe(first);
    // 48 refreshes/day × ~6 calls stays well under 500.
    expect(48 * first).toBeLessThan(500);
  });

  it("renews an expired token with the refresh token", async () => {
    await connect("good-refresh");
    const r = await loadLinkedIn(cfg(), store, LI_NOW + 60 * DAY);
    expect(r.state).toBe("live");
    expect(await store.get<StoredToken>(LI_TOKEN_KEY)).toMatchObject({ accessToken: "li_at_2", refreshToken: "rt_2" });
  });

  it("without a refresh token: warns a week ahead, then asks to reconnect and keeps the last data", async () => {
    await connect();
    await loadLinkedIn(cfg(), store, LI_NOW);
    expect(await loadLinkedIn(cfg(), store, LI_NOW + 54 * DAY)).toMatchObject({ state: "live", action: { label: "reconnect" } });
    const r = await loadLinkedIn(cfg(), store, LI_NOW + 61 * DAY);
    expect(r).toMatchObject({ state: "setup", action: { label: "reconnect" } });
    expect(r.summary?.posts.length).toBe(3);
  });

  it("a revoked token (401) asks to reconnect", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    await connect();
    await store.set(LI_TOKEN_KEY, { ...(await store.get<StoredToken>(LI_TOKEN_KEY))!, accessToken: "li_expired" });
    await store.del(LI_SNAPSHOT_KEY);
    expect(await loadLinkedIn(cfg(), store, LI_NOW)).toMatchObject({ state: "setup", action: { label: "reconnect" } });
    err.mockRestore();
  });
});

describe("on the dashboard", () => {
  it("not configured → sample data, LinkedIn source stays 'mock'", async () => {
    const d = await buildBrief(LI_NOW, {});
    expect(d.linkedin).toBeUndefined();
    expect(d.sources.find((s) => s.name === "LinkedIn")?.state).toBe("mock");
  });

  it("configured but not connected → 'connect' link in the sidebar", async () => {
    const d = await buildBrief(LI_NOW, env);
    expect(d.sources.find((s) => s.name === "LinkedIn")).toMatchObject({ state: "setup", action: { label: "connect" } });
  });

  it("connected → live page data, posting card and sync time (Curaçao)", async () => {
    await connect();
    const d = await buildBrief(LI_NOW, env);
    expect(d.linkedin?.page.name).toBe("Caribglobal Data Services");
    expect(d.sources.find((s) => s.name === "LinkedIn")).toMatchObject({ state: "live", t: "09:37" });
    expect(d.checks.find((c) => c.source.startsWith("LinkedIn"))).toEqual(mapLinkedInCheck(d.linkedin!, LI_NOW));
    expect(d.checks.find((c) => c.source.startsWith("LinkedIn"))?.verdict).toBe("2 posts this week. Best: “ISO 27001: why we are doing it #security” (2.4K impressions).");
  });

  it("engagement rate follows LinkedIn's formula", () => {
    expect(engagementRate({ impressionCount: 1000, clickCount: 10, likeCount: 20, commentCount: 5, shareCount: 5 })).toBe(0.04);
    expect(engagementRate({})).toBe(0);
  });
});
