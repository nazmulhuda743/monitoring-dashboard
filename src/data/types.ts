/**
 * Domain types for the morning brief. These are the contracts the future
 * Freshdesk / ClickUp / LinkedIn / Google Calendar adapters must produce.
 */
import type { ToneName } from "@/lib/tones";

export type SourceName = "Freshdesk" | "ClickUp" | "LinkedIn" | "Calendar";

export type NeedId = string;
export type NeedStatus = "done" | "later";

export interface Need {
  id: NeedId;
  /** Short name used in "Start with …" CTA. */
  short: string;
  /** Label used in the energy visual. */
  energyLabel: string;
  source: string;
  due: string;
  tone: ToneName;
  title: string;
  why: string;
  cta: string;
  /** Link the main button opens (e.g. the ClickUp task). */
  url?: string;
  /** Past due → counted as "overdue" in the summary card. */
  overdue: boolean;
  /** Bar color in the summary card. */
  color: string;
  /** Arrow/label color in the energy visual (defaults to `color`). */
  energyColor?: string;
  /**
   * What "Decided this week" shows when this is marked done.
   * `undefined` → a generic line; `null` → nothing.
   */
  decision?: Omit<Decision, "day"> | null;
}

export type MeetingKind = "n" | "focus" | "flag" | "lunch";

export interface MeetingPrep {
  goal: string;
  with: string;
  ctx: { src: string; t: string }[];
  last: string;
}

export interface CalendarEvent {
  /** Key into prep notes; empty string = not preppable. */
  k: string;
  start: number; // decimal hours, e.g. 8.5 = 08:30
  end: number;
  t: string;
  title: string;
  /** Short title used on the focus dial. */
  dialTitle: string;
  meta: string;
  kind: MeetingKind;
  prep?: MeetingPrep;
}

export type WaitState = "late" | "today" | "blocked" | "ok" | "done";

export interface WaitingItem {
  id: string;
  who: string;
  role: string;
  what: string;
  asked: string;
  due: string;
  s: WaitState;
  label: string;
  url?: string;
  /** Label in the energy visual while this is late and not nudged. */
  energyLabel?: string;
}

export type ProjectStatus = "risk" | "you" | "watch" | "ok";

export interface Project {
  id: string;
  s: ProjectStatus;
  name: string;
  line: string;
  pct: number;
  next: string;
  owner: string;
  updated: string;
  latest: string;
  items: string[];
  url?: string;
}

export interface ProjectGroup {
  /** Company / ClickUp space, e.g. "Caribglobal Data Services". */
  label: string;
  items: Project[];
}

export type ClientHealth = "risk" | "watch" | "ok";

export interface Client {
  name: string;
  sector: string;
  value: string;
  valueK: number;
  date: string;
  daysOut: number;
  h: ClientHealth;
  signal: string;
  move: string;
  /** Renewal runway label placement. */
  runway: { top: boolean; anchor: "c" | "l" | "r" };
}

export type Channel = "you" | "cds" | "ymi";
export type PostBase = "ready" | "approved" | "draft" | "gap";
export type PostStatus = PostBase | "changes";

export interface Post {
  id: string;
  m: 11 | 12;
  d: number;
  dow: string;
  time: string;
  ch: Channel;
  title: string;
  by: string;
  base: PostBase;
  note: string;
  body: string;
  /** Label in the energy visual if this post still needs a decision. */
  energyLabel?: string;
}

export interface SupportAgent {
  name: string;
  sub: string;
  subTone?: ToneName;
  open: number;
  solved: number;
  firstReply: string;
  firstReplyLate: boolean;
  sla: number;
  status: "ok" | "slip" | "ramp";
}

export interface SupportTeam {
  label: string;
  headline: string;
  status: string;
  tone: ToneName;
  metrics: { k: string; v: string; tone?: ToneName }[];
  trend: number[];
  agents: SupportAgent[];
  noteTag: string;
  note: string;
  noteTone: ToneName;
}

export interface Decision {
  day: string;
  what: string;
  told: string;
  src: string;
}

export interface Check {
  source: string;
  title: string;
  verdict: string;
  ok: boolean;
  metrics: { v: string; k: string }[];
}

export interface Pull {
  /** Color */
  c: string;
  /** Label */
  t: string;
}

export interface SourceInfo {
  name: SourceName;
  /** Last sync, Curaçao "HH:MM". */
  t: string;
  /** live = real data, mock = sample data, error = fell back to sample data. */
  state: "live" | "mock" | "error";
}

/** Everything the page renders that comes from an integration. */
export interface BriefData {
  needs: Need[];
  waiting: WaitingItem[];
  /** Override for the pills above "Waiting on others" (derived when absent). */
  waitingPills?: { t: string; tone: ToneName }[];
  projectGroups: ProjectGroup[];
  pastDecisions: Decision[];
  checks: Check[];
  sources: SourceInfo[];
  /** Extra threads in the energy visual (after needs, posts and late hand-offs). */
  otherPulls: Pull[];
}
