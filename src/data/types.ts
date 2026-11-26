/**
 * Domain types for the morning brief. These are the contracts the future
 * Freshdesk / ClickUp / LinkedIn / Google Calendar adapters must produce.
 */
import type { ToneName } from "@/lib/tones";

export type SourceName = "Freshdesk" | "ClickUp" | "LinkedIn" | "Calendar";

export type NeedId = "telecom" | "board" | "linkedin" | "pricing";
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
}

export type ProjectStatus = "risk" | "you" | "watch" | "ok";

export interface Project {
  id: string;
  co: "CDS" | "YamaMi";
  s: ProjectStatus;
  name: string;
  line: string;
  pct: number;
  next: string;
  owner: string;
  updated: string;
  latest: string;
  items: string[];
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
