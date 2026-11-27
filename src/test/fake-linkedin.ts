/**
 * Fake LinkedIn (OAuth + /rest Community Management API) for tests and demos.
 * Enforces the same headers as LinkedIn (Bearer token, Linkedin-Version,
 * Rest.li 2.0) so a wrong request fails here too.
 *
 *   PORT=4020 node --no-warnings src/test/fake-linkedin.ts
 *
 * OAuth codes: "good" → token without refresh; "good-refresh" → with refresh token.
 * Admin of pages 111 ("Caribglobal Data Services") and 222 ("YamaMi").
 * Access token "li_expired" → 401.
 */
import { createServer, type Server } from "node:http";

export const LI_NOW = Date.parse("2026-11-23T13:37:00Z"); // Mon 09:37 Curaçao
const D = 86400000;

export const LI_POSTS = [
  { id: "urn:li:share:7001", commentary: "ISO 27001: why we are doing it {hashtag|\\#|security}", publishedAt: LI_NOW - 1 * D, lifecycleState: "PUBLISHED" },
  { id: "urn:li:ugcPost:7002", commentary: "We are hiring support engineers in Santo Domingo", publishedAt: LI_NOW - 3 * D, lifecycleState: "PUBLISHED" },
  { id: "urn:li:share:7003", commentary: "Draft that should be hidden", publishedAt: LI_NOW - 2 * D, lifecycleState: "DRAFT" },
  { id: "urn:li:share:7004", commentary: "Older post", publishedAt: LI_NOW - 12 * D, lifecycleState: "PUBLISHED" },
];
export const LI_STATS: Record<string, object> = {
  "urn:li:share:7001": { impressionCount: 2400, clickCount: 60, likeCount: 80, commentCount: 12, shareCount: 8, engagement: 0.0667 },
  "urn:li:ugcPost:7002": { impressionCount: 1800, clickCount: 30, likeCount: 45, commentCount: 5, shareCount: 10 },
  // 7004 had no activity → omitted, like LinkedIn does
};

export function startFakeLinkedIn(port = 0): Promise<{ url: string; server: Server; calls: string[] }> {
  const calls: string[] = [];
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    calls.push(`${req.method} ${u.pathname}${u.search}`);
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    // ---- OAuth
    if (u.pathname === "/oauth/v2/authorization") {
      // Stand-in for LinkedIn's "Allow" screen: approve immediately.
      const back = new URL(u.searchParams.get("redirect_uri") ?? "");
      back.searchParams.set("code", "good");
      back.searchParams.set("state", u.searchParams.get("state") ?? "");
      res.writeHead(302, { location: back.toString() });
      return res.end();
    }
    if (u.pathname === "/oauth/v2/accessToken" && req.method === "POST") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        const f = new URLSearchParams(raw);
        if (f.get("client_id") !== "cid" || f.get("client_secret") !== "csecret") return send(401, { error: "invalid_client" });
        if (f.get("grant_type") === "authorization_code" && (f.get("code") === "good" || f.get("code") === "good-refresh")) {
          if (!f.get("redirect_uri")) return send(400, { error: "invalid_request", error_description: "redirect_uri missing" });
          const withRefresh = f.get("code") === "good-refresh";
          return send(200, { access_token: "li_at_1", expires_in: 5184000, scope: "r_organization_social,rw_organization_admin", ...(withRefresh ? { refresh_token: "rt_1", refresh_token_expires_in: 31536000 } : {}) });
        }
        if (f.get("grant_type") === "refresh_token" && f.get("refresh_token") === "rt_1") {
          return send(200, { access_token: "li_at_2", expires_in: 5184000, refresh_token: "rt_2", refresh_token_expires_in: 30000000 });
        }
        send(400, { error: "invalid_grant", error_description: "bad code" });
      });
      return;
    }

    // ---- REST API: same header rules as LinkedIn
    if (!u.pathname.startsWith("/rest/")) return send(404, { message: "not found" });
    const auth = req.headers.authorization ?? "";
    if (auth === "Bearer li_expired" || !/^Bearer li_at_\d$/.test(auth)) return send(401, { status: 401, message: "Invalid access token" });
    if (req.headers["linkedin-version"] !== "202611") return send(426, { message: "Requested version is not active" });
    if (req.headers["x-restli-protocol-version"] !== "2.0.0") return send(400, { message: "Rest.li 2.0 required" });

    const p = decodeURIComponent(u.pathname.slice(5)); // servers decode %3A etc. in paths
    const q = u.searchParams;
    if (p === "/organizationAcls" && q.get("q") === "roleAssignee") {
      return send(200, { elements: [111, 222].map((id) => ({ organization: `urn:li:organization:${id}`, role: "ADMINISTRATOR", state: "APPROVED" })) });
    }
    if (p === "/organizations/111") return send(200, { id: 111, localizedName: "Caribglobal Data Services", vanityName: "caribglobal-data-services" });
    if (p === "/organizations/222") return send(200, { id: 222, localizedName: "YamaMi", vanityName: "yamami" });
    if (p === "/posts" && q.get("q") === "author") {
      if (req.headers["x-restli-method"] !== "FINDER") return send(400, { message: "FINDER expected" });
      if (q.get("author") !== "urn:li:organization:111" && q.get("author") !== "urn:li:organization:222") return send(403, { message: "Not allowed" });
      return send(200, { elements: q.get("author") === "urn:li:organization:111" ? LI_POSTS : [] });
    }
    if (p === "/organizationalEntityShareStatistics" && q.get("q") === "organizationalEntity") {
      const raw = u.search;
      if (raw.includes("timeIntervals=")) {
        if (!/timeIntervals=\(timeRange:\(start:\d+,end:\d+\),timeGranularityType:DAY\)/.test(decodeURIComponent(raw))) return send(400, { message: "bad timeIntervals" });
        return send(200, { elements: Array.from({ length: 7 }, () => ({ totalShareStatistics: { impressionCount: 600, clickCount: 12, likeCount: 18, commentCount: 3, shareCount: 2 } })) });
      }
      const shares = raw.match(/shares=List\(([^)]*)\)/)?.[1]?.split(",").map(decodeURIComponent) ?? [];
      const ugc = [...q.entries()].filter(([k]) => /^ugcPosts\[\d+\]$/.test(k)).map(([, v]) => v);
      const els = [
        ...shares.filter((s) => LI_STATS[s]).map((s) => ({ share: s, totalShareStatistics: LI_STATS[s] })),
        ...ugc.filter((s) => LI_STATS[s]).map((s) => ({ ugcPost: s, totalShareStatistics: LI_STATS[s] })),
      ];
      return send(200, { elements: els });
    }
    if (p === "/networkSizes/urn:li:organization:111" && q.get("edgeType") === "COMPANY_FOLLOWED_BY_MEMBER") return send(200, { firstDegreeSize: 4321 });
    send(404, { message: `No route ${p}` });
  });
  return new Promise((resolve) =>
    server.listen(port, () => {
      const a = server.address();
      resolve({ url: `http://localhost:${typeof a === "object" && a ? a.port : port}`, server, calls });
    }),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startFakeLinkedIn(Number(process.env.PORT) || 4020).then(({ url }) => console.log(`Fake LinkedIn on ${url} (client cid/csecret, code "good")`));
}
