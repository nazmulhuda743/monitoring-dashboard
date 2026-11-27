/**
 * Pure mapping: LinkedIn API data → section 06 "<page> on LinkedIn".
 * No network, no clock (pass `now`) — unit-tested in linkedin.test.ts.
 * Periods: "last 30 days" vs "the 30 before"; all dates in Curaçao time.
 */
import type { Check, LinkedInKpi, LinkedInRow, LinkedInSummary } from "@/data/types";
import { dayDateMonth, formatBusinessTime, shortDate, weekdayOf } from "@/lib/business-time";
import type { LIDay, LIPost, LIShareStats } from "./api";

const DAY = 86400000;
const n = (v: number | undefined) => (typeof v === "number" && Number.isFinite(v) ? Math.max(0, v) : 0);
const nf = new Intl.NumberFormat("en-US");
/** 52400 → "52.4k", 3000 → "3k" (design style). */
export const fk = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(".0", "")}k` : String(Math.round(v)));
const sign = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "±");
const clip = (s: string, len: number) => (s.length > len ? `${s.slice(0, len - 1).trimEnd()}…` : s);
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** LinkedIn's engagement rate: (clicks + likes + comments + shares) / impressions. */
export function engagementRate(s: LIShareStats) {
  const imp = n(s.impressionCount);
  return imp ? (n(s.clickCount) + n(s.likeCount) + n(s.commentCount) + n(s.shareCount)) / imp : 0;
}

export const postUrl = (id: string) => `https://www.linkedin.com/feed/update/${id}/`;

/** "Caribglobal Data Services" → "CDS"; one- or two-word names stay as they are. */
export function pageLabel(name: string) {
  const words = name.split(/\s+/).filter((w) => /^[A-Za-zÀ-ÿ]/.test(w));
  return words.length >= 3 ? words.map((w) => w[0].toUpperCase()).join("") : name;
}

export function postFormat(p: LIPost): string {
  const c = p.content;
  if (p.reshareContext) return "Repost";
  if (!c || Object.keys(c).length === 0) return "Text";
  if (c.multiImage || c.carousel) return "Carousel";
  if (c.article) return "Article";
  if (c.poll) return "Poll";
  if (c.celebration) return "Celebration";
  const id = c.media?.id ?? "";
  if (id.startsWith("urn:li:video:")) return "Video";
  if (id.startsWith("urn:li:document:")) return "Document";
  if (id.startsWith("urn:li:image:")) return "Image";
  return "Post";
}

function cleanText(s: string | undefined) {
  return (s ?? "")
    .replace(/\{hashtag\|\\?#\|([^}]+)\}/g, "#$1") // LinkedIn "little text" hashtags
    .replace(/@\[([^\]]+)\]\([^)]*\)/g, "$1") // mentions
    .trim();
}

export function mapRows(posts: LIPost[], stats: Map<string, LIShareStats>): LinkedInRow[] {
  return posts
    .map((p) => {
      const at = p.publishedAt ?? p.createdAt ?? 0;
      const s = stats.get(p.id) ?? {};
      const firstLine = cleanText(p.commentary).split(/\n+/)[0].replace(/\s+/g, " ");
      const rate = typeof s.engagement === "number" && s.engagement >= 0 ? s.engagement : engagementRate(s);
      return {
        id: p.id,
        title: clip(firstLine || "(post without text)", 90),
        date: dayDateMonth(at),
        format: postFormat(p),
        url: postUrl(p.id),
        publishedAt: at,
        impressions: n(s.impressionCount),
        reactions: n(s.likeCount),
        comments: n(s.commentCount),
        reposts: n(s.shareCount),
        rate: Math.round(rate * 1000) / 10, // one decimal, percent
      };
    })
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

function totals(days: LIDay[]): LIShareStats {
  const sum = (k: keyof LIShareStats) => days.reduce((t, d) => t + n(d.stats[k]), 0);
  return { impressionCount: sum("impressionCount"), clickCount: sum("clickCount"), likeCount: sum("likeCount"), commentCount: sum("commentCount"), shareCount: sum("shareCount") };
}

/** Three data-driven observations (fewer if there isn't enough to compare). */
export function insights(rows: LinkedInRow[]): { t: string; d: string }[] {
  const out: { t: string; d: string }[] = [];
  if (rows.length >= 2) {
    const [best, ...rest] = [...rows].sort((a, b) => b.rate - a.rate);
    const others = avg(rest.map((r) => r.rate));
    if (others > 0 && best.rate > others) {
      out.push({ t: "One post carried the month.", d: `“${clip(best.title, 60)}” got ${best.rate.toFixed(1)}% engagement, ${(best.rate / others).toFixed(1)}× your other posts.` });
    }
  }
  const byFormat = new Map<string, number[]>();
  rows.forEach((r) => byFormat.set(r.format, [...(byFormat.get(r.format) ?? []), r.rate]));
  if (byFormat.size >= 2) {
    const ranked = [...byFormat.entries()].map(([f, rs]) => ({ f, a: avg(rs), k: rs.length })).sort((a, b) => b.a - a.a);
    const top = ranked[0];
    const low = ranked[ranked.length - 1];
    out.push({ t: `${top.f} posts work best.`, d: `${top.f} averaged ${top.a.toFixed(1)}% engagement; ${low.f.toLowerCase()} posts got ${low.a.toFixed(1)}%.` });
  }
  const byDay = new Map<string, number[]>();
  rows.forEach((r) => byDay.set(weekdayOf(r.publishedAt), [...(byDay.get(weekdayOf(r.publishedAt)) ?? []), r.rate]));
  if (byDay.size >= 2) {
    const ranked = [...byDay.entries()].map(([d, rs]) => ({ d, a: avg(rs) })).sort((a, b) => b.a - a.a);
    const top = ranked[0];
    const low = ranked[ranked.length - 1];
    out.push({ t: `${top.d} beats ${low.d}.`, d: `Posts on ${top.d} averaged ${top.a.toFixed(1)}% engagement; ${low.d} posts ${low.a.toFixed(1)}%.` });
  }
  return out.slice(0, 3);
}

export function mapSummary(args: {
  page: { id: string; name: string; vanityName: string | null; label?: string };
  followers: number | null;
  /** Page posts from the last ~60 days (published), any order. */
  posts: LIPost[];
  postStats: Map<string, LIShareStats>;
  /** Daily page stats for the last 60 days. */
  days: LIDay[];
  /** New followers per week, oldest first (≈12). */
  weekGains: { start: number; gain: number }[];
  now: number;
}): LinkedInSummary {
  const { page, followers, posts, postStats, days, weekGains, now } = args;
  const label = page.label || pageLabel(page.name);
  const cut = now - 30 * DAY;
  const cur = totals(days.filter((d) => d.start >= cut));
  const prev = totals(days.filter((d) => d.start < cut && d.start >= now - 60 * DAY));
  const rateCur = engagementRate(cur) * 100;
  const ratePrev = engagementRate(prev) * 100;
  const impCur = n(cur.impressionCount);
  const impPrev = n(prev.impressionCount);

  const rowsAll = mapRows(posts, postStats);
  const rows = rowsAll.filter((r) => r.publishedAt >= cut);
  const prevPosts = rowsAll.filter((r) => r.publishedAt < cut && r.publishedAt >= now - 60 * DAY).length;

  const gains = weekGains.map((w) => w.gain);
  const last4 = gains.slice(-4).reduce((a, b) => a + b, 0);
  const before4 = gains.slice(-8, -4).reduce((a, b) => a + b, 0);
  const growthPct = followers != null && followers - last4 > 0 ? Math.round((last4 / (followers - last4)) * 1000) / 10 : null;

  const pct = (a: number, b: number) => (b ? Math.round(((a - b) / b) * 100) : null);
  const impDelta = pct(impCur, impPrev);
  const rateDiff = rateCur - ratePrev;
  const postDiff = rows.length - prevPosts;

  const kpis: LinkedInKpi[] = [
    {
      k: "Followers",
      v: followers == null ? "—" : nf.format(followers),
      d: `${sign(last4)}${nf.format(Math.abs(last4))}`,
      dk: growthPct == null ? "in 30 days" : `${sign(growthPct)}${Math.abs(growthPct).toFixed(1)}% in 30 days`,
      tone: last4 >= 0 ? "mint" : "red",
    },
    {
      k: "Impressions",
      v: fk(impCur),
      d: impDelta == null ? "new" : `${sign(impDelta)}${Math.abs(impDelta)}%`,
      dk: impPrev ? `vs ${fk(impPrev)}` : "no data before",
      tone: impDelta == null || impDelta >= 0 ? "mint" : "red",
    },
    {
      k: "Engagement rate",
      v: `${rateCur.toFixed(1)}%`,
      d: `${sign(rateDiff)}${Math.abs(rateDiff).toFixed(1)} pts`,
      dk: `vs ${ratePrev.toFixed(1)}%`,
      tone: rateDiff >= 0 ? "mint" : "red",
    },
    {
      k: "Posts published",
      v: String(rows.length),
      d: postDiff > 0 ? `+${postDiff}` : postDiff < 0 ? `${-postDiff} fewer` : "same",
      dk: `vs ${prevPosts} before`,
      tone: postDiff >= 0 ? (postDiff === 0 ? "grey" : "mint") : "amber",
    },
  ];

  // Headline sentence from the numbers.
  const lead =
    last4 < 0 ? "Losing followers." : last4 === 0 ? "Flat this month." : before4 && last4 > before4 * 1.1 ? "Growing, and faster." : before4 && last4 < before4 * 0.9 ? "Growing, but slower." : "Growing steadily.";
  const best = [...rows].sort((a, b) => b.rate - a.rate)[0];
  const parts = [
    `${label} gained ${nf.format(Math.max(0, last4))} followers in 30 days${before4 ? `, ${Math.abs(pct(last4, before4) ?? 0)}% ${last4 >= before4 ? "more" : "fewer"} than the month before` : ""}.`,
    `Engagement is ${rateDiff >= 0 ? "up" : "down"} to ${rateCur.toFixed(1)}%${best ? `, led by “${clip(best.title, 50)}”` : ""}.`,
    postDiff < 0 ? `Posting slowed: ${rows.length} posts vs ${prevPosts} the month before.` : "",
  ];

  return {
    page: {
      name: page.name,
      label,
      url: page.vanityName ? `https://www.linkedin.com/company/${page.vanityName}/` : `https://www.linkedin.com/company/${page.id}/`,
      followers,
      growthPct,
    },
    syncedAt: formatBusinessTime(new Date(now)),
    lead,
    summary: parts.filter(Boolean).join(" "),
    kpis,
    weeks: weekGains.map((w, i) => ({ v: w.gain, l: i % 3 === 0 || i === weekGains.length - 1 ? shortDate(w.start) : "" })),
    pace: { last: last4, before: before4 },
    works: insights(rows),
    bestLabel: "Best this month",
    avgRate: Math.round(rateCur * 10) / 10,
    posts: rows,
  };
}

/** "Everything else" card for the LinkedIn page (posts of the last 7 days). */
export function mapLinkedInCheck(li: LinkedInSummary, now: number): Check {
  const recent = li.posts.filter((p) => p.publishedAt > now - 7 * DAY);
  const best = [...recent].sort((a, b) => b.impressions - a.impressions)[0];
  const verdict = recent.length
    ? `${recent.length} post${recent.length === 1 ? "" : "s"} this week. Best: “${clip(best.title, 48)}” (${fk(best.impressions)} seen).`
    : "No posts on the page in the last 7 days.";
  return {
    source: `LinkedIn · ${li.page.label}`,
    title: "Posting",
    verdict,
    ok: recent.length > 0,
    metrics: [
      { v: String(recent.length), k: "posts 7d" },
      { v: fk(recent.reduce((t, p) => t + p.impressions, 0)), k: "seen" },
      { v: li.page.followers == null ? "—" : fk(li.page.followers), k: "followers" },
    ],
  };
}
