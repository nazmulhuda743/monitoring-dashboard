/**
 * Pure mapping: LinkedIn API data → dashboard types. No network, no clock
 * (pass `now`) — unit-tested in adapt.test.ts.
 */
import type { Check, LinkedInPost, LinkedInSummary } from "@/data/types";
import { dayAndDate } from "@/lib/business-time";
import type { LIPost, LIShareStats } from "./api";

const n = (v: number | undefined) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0);

/** LinkedIn's engagement rate: (clicks + likes + comments + shares) / impressions. */
export function engagementRate(s: LIShareStats) {
  const imp = n(s.impressionCount);
  return imp ? (n(s.clickCount) + n(s.likeCount) + n(s.commentCount) + n(s.shareCount)) / imp : 0;
}

export const postUrl = (id: string) => `https://www.linkedin.com/feed/update/${id}/`;

export function mapPosts(posts: LIPost[], stats: Map<string, LIShareStats>): LinkedInPost[] {
  return posts
    .map((p) => {
      const at = p.publishedAt ?? p.createdAt ?? 0;
      const s = stats.get(p.id) ?? {};
      const [dow, day] = dayAndDate(at).split(" ");
      return {
        id: p.id,
        url: postUrl(p.id),
        text: (p.commentary ?? "")
          .replace(/\{hashtag\|\\?#\|([^}]+)\}/g, "#$1") // LinkedIn "little text" hashtags
          .replace(/@\[([^\]]+)\]\([^)]*\)/g, "$1") // mentions
          .replace(/\s+/g, " ")
          .trim(),
        publishedAt: at,
        dow: dow.toUpperCase(),
        day,
        impressions: n(s.impressionCount),
        reactions: n(s.likeCount),
        comments: n(s.commentCount),
        shares: n(s.shareCount),
        clicks: n(s.clickCount),
        engagement: typeof s.engagement === "number" && s.engagement >= 0 ? s.engagement : engagementRate(s),
      };
    })
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

export function mapSummary(args: {
  page: { name: string; vanityName: string | null; id: string };
  followers: number | null;
  posts: LinkedInPost[];
  weekDays: LIShareStats[];
  now: number;
}): LinkedInSummary {
  const { page, followers, posts, weekDays, now } = args;
  const sum = (k: keyof LIShareStats) => weekDays.reduce((t, d) => t + n(d[k]), 0);
  const totals: LIShareStats = {
    impressionCount: sum("impressionCount"),
    clickCount: sum("clickCount"),
    likeCount: sum("likeCount"),
    commentCount: sum("commentCount"),
    shareCount: sum("shareCount"),
  };
  return {
    page: {
      name: page.name,
      url: page.vanityName ? `https://www.linkedin.com/company/${page.vanityName}/` : `https://www.linkedin.com/company/${page.id}/`,
      followers,
    },
    posts,
    week: {
      posts: posts.filter((p) => p.publishedAt > now - 7 * 86400000).length,
      impressions: n(totals.impressionCount),
      reactions: n(totals.likeCount),
      comments: n(totals.commentCount),
      shares: n(totals.shareCount),
      engagement: engagementRate(totals),
    },
  };
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const clip = (s: string, len: number) => (s.length > len ? `${s.slice(0, len - 1).trimEnd()}…` : s);

/** "Everything else" card for the LinkedIn page. */
export function mapLinkedInCheck(li: LinkedInSummary, now: number): Check {
  const recent = li.posts.filter((p) => p.publishedAt > now - 7 * 86400000);
  const best = [...recent].sort((a, b) => b.impressions - a.impressions)[0];
  const verdict = recent.length
    ? `${recent.length} post${recent.length === 1 ? "" : "s"} this week. Best: “${clip(best.text || "untitled", 48)}” (${compact.format(best.impressions)} impressions).`
    : "No posts on the page in the last 7 days.";
  return {
    source: `LinkedIn · ${li.page.name}`,
    title: "Posting",
    verdict,
    ok: recent.length > 0,
    metrics: [
      { v: String(li.week.posts), k: "posts 7d" },
      { v: compact.format(li.week.impressions), k: "impressions" },
      { v: li.page.followers == null ? "—" : compact.format(li.page.followers), k: "followers" },
    ],
  };
}
