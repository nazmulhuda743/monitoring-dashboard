/**
 * Pure mapping: ClickUp API data → dashboard types. No network, no env, no
 * clock (pass `now`) — so it is fully unit-tested in adapt.test.ts.
 *
 * Mapping (agreed with the user; adjust here if the client's ClickUp differs):
 *  - Needs you       = open tasks assigned to me, due before the end of today (Curaçao)
 *  - Waiting         = open tasks I created and assigned to someone else
 *                      (+ ones they closed in the last 24h → "Delivered")
 *  - Projects        = one per List (or Folder), grouped by Space
 *  - Decided         = tasks tagged `decision`, done in the last 7 days
 *  - Team tasks card = open / overdue / closed-in-7-days counts
 */
import type { Check, Decision, Need, Project, ProjectGroup, ProjectStatus, WaitingItem, WaitState } from "@/data/types";
import { businessDayBounds, businessDaysBetween, dayAndDate, dayTag, formatBusinessTime, shortDate } from "@/lib/business-time";
import type { CUTask, CUUser } from "./api";

const ms = (v: string | null | undefined) => (v ? Number(v) : null);
const isClosed = (t: CUTask) => t.status.type === "closed" || t.status.type === "done";
const isMine = (t: CUTask, me: CUUser) => t.assignees.some((a) => a.id === me.id);
const name = (u: CUUser | null | undefined) => u?.username?.trim() || u?.email?.split("@")[0] || "Someone";
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const firstSentence = (s: string | null | undefined, n = 220) => {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  const m = t.match(/^(.+?[.!?])(\s|$)/);
  return clip(m ? m[1] : t, n);
};
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** "Today, 17:00" / "Today" (no time) / "Tomorrow" / "Dec 15" — Curaçao. */
function dueLabel(due: number, now: number) {
  const days = businessDaysBetween(now, due);
  const hhmm = formatBusinessTime(new Date(due));
  // ClickUp date-only due dates land on a fixed hour; treat 00:00/04:00 as "no time".
  const hasTime = hhmm !== "00:00" && hhmm !== "04:00";
  if (days === 0) return hasTime ? `Today, ${hhmm}` : "Today";
  if (days === 1) return "Tomorrow";
  return shortDate(due);
}

function overdueLabel(due: number, now: number) {
  const days = businessDaysBetween(due, now);
  if (days <= 0) {
    const hours = Math.max(1, Math.round((now - due) / 3600000));
    return `Overdue ${hours}h`;
  }
  return `Overdue ${plural(days, "day")}`;
}

// ---------------- Needs you ----------------

export function mapNeeds(open: CUTask[], me: CUUser, now: number, spaceNames: Record<string, string>, limit = 6): Need[] {
  const { end } = businessDayBounds(now);
  return open
    .filter((t) => isMine(t, me) && !isClosed(t) && ms(t.due_date) !== null && ms(t.due_date)! < end)
    .sort((a, b) => ms(a.due_date)! - ms(b.due_date)!)
    .slice(0, limit)
    .map((t): Need => {
      const due = ms(t.due_date)!;
      const overdue = due < now;
      const urgent = t.priority?.priority === "urgent";
      const space = spaceNames[t.space.id];
      const why =
        firstSentence(t.text_content) ||
        `In ${t.list.name}${t.priority ? ` · ${t.priority.priority} priority` : ""}. Status: ${t.status.status}.`;
      return {
        id: `cu-${t.id}`,
        short: clip(t.name, 28),
        energyLabel: clip(t.name, 22),
        source: space ? `ClickUp · ${space}` : "ClickUp",
        due: overdue ? overdueLabel(due, now) : dueLabel(due, now),
        tone: overdue || urgent ? "red" : "amber",
        title: t.name,
        why,
        cta: "Open in ClickUp",
        url: t.url,
        overdue,
        color: overdue || urgent ? "#F26B5E" : "#F5B13D",
        decision: { what: `Done: ${t.name}`, told: "", src: "CLICKUP" },
      };
    });
}

// ---------------- Waiting on others ----------------

const WAIT_ORDER: Record<WaitState, number> = { late: 0, today: 1, blocked: 2, ok: 3, done: 4 };

export function mapWaiting(open: CUTask[], recentlyDone: CUTask[], me: CUTask["creator"], now: number, limit = 8): WaitingItem[] {
  const delegated = (t: CUTask) => t.creator?.id === me.id && t.assignees.length > 0 && !isMine(t, me);
  const items: WaitingItem[] = [];

  for (const t of open.filter((t) => !isClosed(t) && delegated(t))) {
    const due = ms(t.due_date);
    const who = t.assignees[0];
    let s: WaitState = "ok";
    let label = "On track";
    if (/block|wait|hold|stuck/i.test(t.status.status)) {
      s = "blocked";
      label = `Waiting · ${t.status.status}`;
    }
    if (due !== null) {
      const days = businessDaysBetween(due, now);
      if (due < now && days >= 1) {
        s = "late";
        label = `${plural(days, "day")} late`;
      } else if (businessDaysBetween(now, due) === 0) {
        s = due < now ? "late" : "today";
        label = due < now ? "Late" : "Due today";
      }
    }
    items.push({
      id: `cu-${t.id}`,
      who: name(who),
      role: t.list.name,
      what: t.name,
      asked: `Asked ${shortDate(Number(t.date_created))} · ClickUp`,
      due: due === null ? "No date" : businessDaysBetween(now, due) === 0 ? `Today ${formatBusinessTime(new Date(due))}` : dayAndDate(due),
      s,
      label,
      url: t.url,
      energyLabel: `${clip(t.name, 16)} · late`,
    });
  }

  for (const t of recentlyDone.filter((t) => isClosed(t) && delegated(t))) {
    const done = ms(t.date_done) ?? ms(t.date_closed);
    if (!done || now - done > 24 * 3600000) continue;
    items.push({
      id: `cu-${t.id}`,
      who: name(t.assignees[0]),
      role: t.list.name,
      what: t.name,
      asked: `Asked ${shortDate(Number(t.date_created))} · ClickUp`,
      due: `Delivered ${formatBusinessTime(new Date(done))}`,
      s: "done",
      label: "✓ Delivered",
      url: t.url,
    });
  }

  return items.sort((a, b) => WAIT_ORDER[a.s] - WAIT_ORDER[b.s]).slice(0, limit);
}

// ---------------- Projects ----------------

export interface ProjectUnit {
  id: string;
  name: string;
  /** List description, if any. */
  content?: string | null;
  /** ClickUp list status ("on track", "at risk", …), if the team uses it. */
  status?: string | null;
  owner?: CUUser | null;
  url: string;
  tasks: CUTask[];
}

const RANK: Record<ProjectStatus, number> = { risk: 0, you: 1, watch: 2, ok: 3 };

/** Map a free-text ClickUp list status to our 4 health levels (null = unknown). */
export function statusFromText(s: string | null | undefined): ProjectStatus | null {
  if (!s) return null;
  if (/risk|red|blocked|off.?track|critical/i.test(s)) return "risk";
  if (/need|input|approv|decision|waiting on (me|ceo|bionda)/i.test(s)) return "you";
  if (/watch|amber|yellow|hold|delay|slip|concern/i.test(s)) return "watch";
  if (/on.?track|green|good|healthy|ok\b/i.test(s)) return "ok";
  return null;
}

export function mapProject(u: ProjectUnit, me: CUUser, now: number): Project & { updatedAt: number } {
  const open = u.tasks.filter((t) => !isClosed(t));
  const closed = u.tasks.length - open.length;
  const overdue = open.filter((t) => ms(t.due_date) !== null && ms(t.due_date)! < now);
  const soonMine = open.filter((t) => isMine(t, me) && ms(t.due_date) !== null && ms(t.due_date)! < now + 7 * 86400000);
  const ratio = open.length ? overdue.length / open.length : 0;

  // One late task is a "watch", not a crisis; risk needs a pattern of lateness.
  const derived: ProjectStatus =
    overdue.length >= 3 || (overdue.length >= 2 && ratio > 0.25) ? "risk" : soonMine.length ? "you" : overdue.length ? "watch" : "ok";
  const s = statusFromText(u.status) ?? derived;

  const dated = open.filter((t) => ms(t.due_date) !== null).sort((a, b) => ms(a.due_date)! - ms(b.due_date)!);
  const next = dated[0];
  const updatedAt = Math.max(0, ...u.tasks.map((t) => ms(t.date_updated) ?? Number(t.date_created)));
  const last = u.tasks.find((t) => (ms(t.date_updated) ?? 0) === updatedAt);

  // Owner = whoever holds most open tasks — someone other than me if possible.
  const ownerCounts = new Map<string, number>();
  open.forEach((t) => t.assignees.forEach((a) => a.id !== me.id && ownerCounts.set(name(a), (ownerCounts.get(name(a)) ?? 0) + 1)));
  const topOwner = [...ownerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? (open.some((t) => isMine(t, me)) ? name(me) : undefined);

  return {
    id: u.id,
    s,
    name: u.name,
    line:
      firstSentence(u.content, 80) ||
      (open.length ? `${plural(open.length, "open task")}${overdue.length ? ` · ${overdue.length} overdue` : ""}` : "No open tasks"),
    pct: u.tasks.length ? Math.round((closed / u.tasks.length) * 100) : 0,
    next: next ? `${clip(next.name, 34)} · ${shortDate(ms(next.due_date)!)}` : "No dated tasks",
    owner: u.owner ? name(u.owner) : (topOwner ?? "Unassigned"),
    updated: updatedAt ? `Updated ${ago(updatedAt, now)}` : "No activity yet",
    latest: last ? `Latest change: “${last.name}” is now ${last.status.status}.` : "No tasks yet.",
    items: dated.slice(0, 3).map((t) => `${clip(t.name, 40)} · ${isMine(t, me) ? "needs you" : dayAndDate(ms(t.due_date)!)}`),
    url: u.url,
    updatedAt,
  };
}

function ago(t: number, now: number) {
  const m = Math.max(0, Math.round((now - t) / 60000));
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

export function mapProjectGroups(groups: { label: string; units: ProjectUnit[] }[], me: CUUser, now: number, maxProjects = 12): ProjectGroup[] {
  // Keep the most recently active projects overall, then group + sort worst-first.
  const all = groups.flatMap((g) => g.units.map((u) => ({ g: g.label, p: mapProject(u, me, now) })));
  const keep = new Set(
    all
      .sort((a, b) => b.p.updatedAt - a.p.updatedAt)
      .slice(0, maxProjects)
      .map((x) => x.p.id),
  );
  return groups
    .map((g) => ({
      label: g.label,
      items: all
        .filter((x) => x.g === g.label && keep.has(x.p.id))
        .map(({ p: { updatedAt: _u, ...p } }) => p)
        .sort((a, b) => RANK[a.s] - RANK[b.s] || a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.items.length);
}

// ---------------- Decisions ----------------

export function mapDecisions(doneThisWeek: CUTask[], tag: string, limit = 8): Decision[] {
  return doneThisWeek
    .filter((t) => isClosed(t) && t.tags.some((x) => x.name.toLowerCase() === tag.toLowerCase()))
    .map((t) => ({ t, at: ms(t.date_done) ?? ms(t.date_closed) ?? 0 }))
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map(({ t, at }) => ({
      day: dayTag(at),
      what: t.name,
      told: t.assignees.length ? `Told: ${t.assignees.map(name).join(", ")}` : "",
      src: "CLICKUP",
    }));
}

// ---------------- Team tasks check card ----------------

export function mapTeamCheck(open: CUTask[], openComplete: boolean, closedThisWeek: number, now: number): Check {
  const live = open.filter((t) => !isClosed(t));
  const overdue = live.filter((t) => ms(t.due_date) !== null && ms(t.due_date)! < now);
  const unowned = overdue.filter((t) => t.assignees.length === 0).length;
  const verdict =
    overdue.length === 0
      ? "Nothing overdue. Every dated task is on schedule."
      : `${overdue.length} overdue, ${unowned ? `${unowned} with no owner` : "all have an owner"}.`;
  return {
    source: "ClickUp",
    title: "Team tasks",
    verdict,
    ok: unowned === 0,
    metrics: [
      { v: `${live.length}${openComplete ? "" : "+"}`, k: "open" },
      { v: String(overdue.length), k: "overdue" },
      { v: String(closedThisWeek), k: "closed" },
    ],
  };
}
