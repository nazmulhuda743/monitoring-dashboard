import "server-only";

/**
 * LinkedIn Community Management API client (read-only, versioned /rest API).
 * Docs: learn.microsoft.com/linkedin/marketing/community-management
 * Every call: Authorization Bearer, Linkedin-Version YYYYMM, Rest.li 2.0.
 */

export interface LIShareStats {
  impressionCount?: number;
  uniqueImpressionsCount?: number;
  clickCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  engagement?: number;
}

export interface LIPost {
  id: string; // urn:li:share:… or urn:li:ugcPost:…
  commentary?: string;
  publishedAt?: number;
  createdAt?: number;
  lifecycleState?: string;
  visibility?: string;
}

export class LinkedInError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const enc = encodeURIComponent;
export const orgUrn = (id: string) => `urn:li:organization:${id}`;

export function createLinkedInClient(opts: { accessToken: string; apiVersion: string; apiUrl: string }) {
  async function get<T>(pathAndQuery: string, finder = false): Promise<T> {
    const res = await fetch(`${opts.apiUrl}${pathAndQuery}`, {
      headers: {
        Authorization: `Bearer ${opts.accessToken}`,
        "Linkedin-Version": opts.apiVersion,
        "X-Restli-Protocol-Version": "2.0.0",
        ...(finder ? { "X-RestLi-Method": "FINDER" } : {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new LinkedInError(`LinkedIn ${res.status} on ${pathAndQuery.split("?")[0]}: ${body.slice(0, 200)}`, res.status);
    }
    return (await res.json()) as T;
  }

  return {
    /** Pages the authenticated member administers. */
    async adminOrganizationIds(): Promise<string[]> {
      const r = await get<{ elements: { organization?: string; organizationTarget?: string; state?: string }[] }>(
        "/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=50",
      );
      return r.elements
        .map((e) => (e.organization ?? e.organizationTarget ?? "").replace("urn:li:organization:", ""))
        .filter(Boolean);
    },

    async organization(id: string) {
      const r = await get<{ id?: number; localizedName?: string; vanityName?: string }>(`/organizations/${enc(id)}`);
      return { id, name: r.localizedName ?? `Page ${id}`, vanityName: r.vanityName ?? null };
    },

    /** Latest posts by the page, newest first (published only). */
    async posts(id: string, count = 10): Promise<LIPost[]> {
      const r = await get<{ elements: LIPost[] }>(`/posts?author=${enc(orgUrn(id))}&q=author&count=${count}&sortBy=CREATED`, true);
      return r.elements.filter((p) => !p.lifecycleState || p.lifecycleState === "PUBLISHED");
    },

    /** Lifetime stats for specific posts (shares and ugcPosts are separate params). */
    async postStats(id: string, postIds: string[]): Promise<Map<string, LIShareStats>> {
      const out = new Map<string, LIShareStats>();
      const base = `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${enc(orgUrn(id))}`;
      type R = { elements: { share?: string; ugcPost?: string; totalShareStatistics: LIShareStats }[] };
      const shares = postIds.filter((p) => p.startsWith("urn:li:share:"));
      const ugc = postIds.filter((p) => p.startsWith("urn:li:ugcPost:"));
      if (shares.length) {
        const r = await get<R>(`${base}&shares=List(${shares.map(enc).join(",")})`);
        r.elements.forEach((e) => e.share && out.set(e.share, e.totalShareStatistics));
      }
      if (ugc.length) {
        const r = await get<R>(`${base}&${ugc.map((u, i) => `ugcPosts[${i}]=${enc(u)}`).join("&")}`);
        r.elements.forEach((e) => e.ugcPost && out.set(e.ugcPost, e.totalShareStatistics));
      }
      return out; // posts with no activity are omitted by LinkedIn → treat as zero
    },

    /** Page-wide organic stats per day between start (incl.) and end (excl.), epoch ms. */
    async pageStatsByDay(id: string, start: number, end: number): Promise<LIShareStats[]> {
      const r = await get<{ elements: { totalShareStatistics: LIShareStats }[] }>(
        `/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${enc(orgUrn(id))}` +
          `&timeIntervals=(timeRange:(start:${start},end:${end}),timeGranularityType:DAY)`,
      );
      return r.elements.map((e) => e.totalShareStatistics);
    },

    async followers(id: string): Promise<number | null> {
      const r = await get<{ firstDegreeSize?: number }>(`/networkSizes/${enc(orgUrn(id))}?edgeType=COMPANY_FOLLOWED_BY_MEMBER`);
      return typeof r.firstDegreeSize === "number" ? r.firstDegreeSize : null;
    },
  };
}

export type LinkedInClient = ReturnType<typeof createLinkedInClient>;
