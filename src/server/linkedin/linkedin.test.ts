import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { LI_NOW, startFakeLinkedIn } from "@/test/fake-linkedin";
import { buildBrief } from "../brief";
import { getStore, type Store } from "../store";
import { engagementRate, mapLinkedInCheck, pageLabel, postFormat } from "./adapt";
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
  it("builds section 06 from real API data (30 days vs the 30 before)", async () => {
    await connect();
    const r = await loadLinkedIn(cfg(), store, LI_NOW);
    expect(r.state).toBe("live");
    if (r.state !== "live") return;
    const li = r.summary;
    expect(li.page).toEqual({ name: "Caribglobal Data Services", label: "CDS", url: "https://www.linkedin.com/company/caribglobal-data-services/", followers: 8412, growthPct: 4.8 });
    expect(li.kpis).toEqual([
      { k: "Followers", v: "8,412", d: "+387", dk: "+4.8% in 30 days", tone: "mint" },
      { k: "Impressions", v: "15k", d: "+25%", dk: "vs 12k", tone: "mint" },
      { k: "Engagement rate", v: "5.0%", d: "+1.0 pts", dk: "vs 4.0%", tone: "mint" },
      { k: "Posts published", v: "3", d: "+2", dk: "vs 1 before", tone: "mint" },
    ]);
    expect(li.lead).toBe("Growing, and faster.");
    expect(li.summary).toBe("CDS gained 387 followers in 30 days, 40% more than the month before. Engagement is up to 5.0%, led by “ISO 27001: why we are doing it #security”.");
    expect(li.weeks.map((w) => w.v)).toEqual([48, 52, 61, 44, 58, 70, 66, 82, 74, 91, 118, 104]);
    expect(li.weeks.filter((w) => w.l).length).toBe(5); // every 3rd week + the last
    expect(li.pace).toEqual({ last: 387, before: 276 });
    // Last 30 days only, newest first; drafts and old posts excluded; first line as title; Curaçao dates.
    expect(li.posts.map((p) => [p.title, p.date, p.format, p.rate])).toEqual([
      ["ISO 27001: why we are doing it #security", "Sun 22 Nov", "Carousel", 6.7],
      ["We are hiring support engineers in Santo Domingo", "Fri 20 Nov", "Video", 5],
      ["Quarterly update", "Wed 11 Nov", "Text", 0],
    ]);
    expect(li.posts[0]).toMatchObject({ impressions: 2400, reactions: 80, comments: 12, reposts: 8, url: "https://www.linkedin.com/feed/update/urn:li:share:7001/" });
    expect(li.works).toEqual([
      { t: "One post carried the month.", d: "“ISO 27001: why we are doing it #security” got 6.7% engagement, 2.7× your other posts." },
      { t: "Carousel posts work best.", d: "Carousel averaged 6.7% engagement; text posts got 0.0%." },
      { t: "Sunday beats Wednesday.", d: "Posts on Sunday averaged 6.7% engagement; Wednesday posts 0.0%." },
    ]);
    expect(li).toMatchObject({ bestLabel: "Best this month", avgRate: 5, syncedAt: "09:37" });
    expect(li.next).toBeUndefined(); // needs a content plan; not from LinkedIn
  });

  it("calls LinkedIn at most every 30 minutes (Development tier: ~500 calls/day)", async () => {
    await connect();
    fake.calls.length = 0; // count refresh calls only, not the one-time connect
    await loadLinkedIn(cfg(), store, LI_NOW);
    const first = fake.calls.length;
    expect(first).toBeLessThanOrEqual(8);
    fake.calls.length = 0;
    await loadLinkedIn(cfg(), store, LI_NOW + 29 * MIN);
    expect(fake.calls).toEqual([]);
    await loadLinkedIn(cfg(), store, LI_NOW + 31 * MIN);
    expect(fake.calls.length).toBe(first);
    // 48 refreshes/day × ~8 calls stays under 500.
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
    // The last good data stays on screen.
    expect(r.summary).toBeDefined();
    expect(r.summary).toEqual((await store.get<{ summary: unknown }>(LI_SNAPSHOT_KEY))?.summary);
  });

  it("a revoked token (401) asks to reconnect", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await connect();
    await store.set(LI_TOKEN_KEY, { ...(await store.get<StoredToken>(LI_TOKEN_KEY))!, accessToken: "li_expired" });
    await store.del(LI_SNAPSHOT_KEY);
    expect(await loadLinkedIn(cfg(), store, LI_NOW)).toMatchObject({ state: "setup", action: { label: "reconnect" } });
    err.mockRestore();
    warn.mockRestore();
  });
});

describe("on the dashboard", () => {
  it("not configured → sample section 06 from the design, LinkedIn source stays 'mock'", async () => {
    const d = await buildBrief(LI_NOW, {});
    expect(d.linkedin.page.label).toBe("CDS");
    expect(d.linkedin.kpis[0]).toMatchObject({ v: "8,412", d: "+387" });
    expect(d.sources.find((s) => s.name === "LinkedIn")?.state).toBe("mock");
  });

  it("configured but not connected → 'connect' link in the sidebar", async () => {
    const d = await buildBrief(LI_NOW, env);
    expect(d.sources.find((s) => s.name === "LinkedIn")).toMatchObject({ state: "setup", action: { label: "connect" } });
  });

  it("connected → live page data, posting card and sync time (Curaçao)", async () => {
    await connect();
    const d = await buildBrief(LI_NOW, env);
    expect(d.linkedin.page.name).toBe("Caribglobal Data Services");
    expect(d.linkedin.next).toBeUndefined(); // sample tip removed once live
    expect(d.sources.find((s) => s.name === "LinkedIn")).toMatchObject({ state: "live", t: "09:37" });
    expect(d.checks.find((c) => c.source.startsWith("LinkedIn"))).toEqual(mapLinkedInCheck(d.linkedin, LI_NOW));
    expect(d.checks.find((c) => c.source.startsWith("LinkedIn"))).toMatchObject({
      verdict: "2 posts this week. Best: “ISO 27001: why we are doing it #security” (2.4k seen).",
      metrics: [{ v: "2", k: "posts 7d" }, { v: "4.2k", k: "seen" }, { v: "8.4k", k: "followers" }],
    });
  });

  it("labels the page by its initials and reads post formats", () => {
    expect(pageLabel("Caribglobal Data Services")).toBe("CDS");
    expect(pageLabel("YamaMi")).toBe("YamaMi");
    expect(postFormat({ id: "x" })).toBe("Text");
    expect(postFormat({ id: "x", content: { media: { id: "urn:li:document:1" } } })).toBe("Document");
    expect(postFormat({ id: "x", reshareContext: {} })).toBe("Repost");
  });

  it("engagement rate follows LinkedIn's formula", () => {
    expect(engagementRate({ impressionCount: 1000, clickCount: 10, likeCount: 20, commentCount: 5, shareCount: 5 })).toBe(0.04);
    expect(engagementRate({})).toBe(0);
  });
});
