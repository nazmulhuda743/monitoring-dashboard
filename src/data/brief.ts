/**
 * Mock data for the Monday 23 November 2026 brief.
 * Copied verbatim from the approved design (Bionda_Dashboard.html).
 * When live integrations land, each export here gets replaced by an adapter
 * that returns the same type — components must not change.
 */
import type {
  BriefData,
  CalendarEvent,
  Check,
  Client,
  Decision,
  MeetingPrep,
  Need,
  Post,
  Project,
  SupportTeam,
  WaitingItem,
} from "./types";

export const profile = {
  name: "Bionda Fonseca",
  firstName: "Bionda",
  initials: "BF",
  role: "CEO · CDS & YamaMi",
  /** Curaçao time of the last sync (from the integrations; mock for now). */
  syncedAt: "06:42",
  /** Curaçao time the next brief is generated each day. */
  nextBriefAt: "06:40",
};

export const sources: BriefData["sources"] = [
  { name: "Freshdesk", t: "06:40", state: "mock" },
  { name: "ClickUp", t: "06:41", state: "mock" },
  { name: "LinkedIn", t: "06:38", state: "mock" },
  { name: "Calendar", t: "06:42", state: "mock" },
];

export const needs: Need[] = [
  {
    id: "telecom",
    short: "Caribbean Telecom",
    energyLabel: "Telecom escalation",
    source: "Freshdesk · CDS",
    due: "SLA breached 6h ago",
    tone: "red",
    title: "Caribbean Telecom escalation is past SLA",
    why: "Ticket #4821: their data export has failed since Friday. $180k/yr account, renewal on Dec 15. A short call from you would reset the tone — Ana has the facts ready.",
    cta: "Open ticket",
    overdue: true,
    color: "#F26B5E",
    decision: { what: "Handled the Caribbean Telecom escalation", told: "Told: Ana, Kevin", src: "FRESHDESK" },
  },
  {
    id: "board",
    short: "the board deck",
    energyLabel: "Board deck",
    source: "Calendar",
    due: "Before 11:00",
    tone: "amber",
    title: "Read the board deck before prep with Marco",
    why: "14 slides, about 20 minutes. Your 09:00 focus block is free for it.",
    cta: "Open deck",
    overdue: false,
    color: "#F5B13D",
    decision: null,
  },
  {
    id: "linkedin",
    short: "your LinkedIn post",
    energyLabel: "LinkedIn post",
    source: "LinkedIn · Personal",
    due: "Posts at 10:00",
    tone: "amber",
    title: "Approve your post on Caribbean data sovereignty",
    why: "Sofía drafted it and scheduled it for 10:00. It won’t publish without your OK.",
    cta: "Review draft",
    overdue: false,
    color: "#F5B13D",
    decision: { what: "Approved your LinkedIn post on Caribbean data sovereignty", told: "Told: Sofía", src: "LINKEDIN" },
  },
  {
    id: "pricing",
    short: "seller pricing",
    energyLabel: "Seller pricing",
    source: "ClickUp · YamaMi",
    due: "Today, 17:00",
    tone: "grey",
    title: "Decide seller fee pricing for Seller Fees v2",
    why: "The only thing blocking the Dec 1 launch. Lucía recommends a flat 6.5%; her one-page summary is on the task.",
    cta: "Review in ClickUp",
    overdue: false,
    color: "#B4BCC5",
    energyColor: "#C9D0D6",
    decision: { what: "Approved seller fee pricing for Seller Fees v2", told: "Told: Lucía, marketplace team", src: "CLICKUP" },
  },
];

const prep: Record<string, MeetingPrep> = {
  standup: {
    goal: "Flag Caribbean Telecom and today’s pricing call. Nothing else needs you here.",
    with: "Ana, Lucía, Diego, Sofía, Kevin",
    ctx: [
      { src: "CLICKUP", t: "3 projects changed status since Friday" },
      { src: "FRESHDESK", t: "Telecom #4821 past SLA" },
    ],
    last: "Fri: agreed to freeze app scope until beta.",
  },
  board: {
    goal: "Agree the three messages for the Dec 10 board meeting.",
    with: "Marco Ruiz, CFO",
    ctx: [
      { src: "CLICKUP", t: "Board deck v3 · 14 slides · unread" },
      { src: "CLICKUP", t: "Q4 cash forecast is 3 days late (on Marco)" },
      { src: "FRESHDESK", t: "Telecom escalation: likely board question" },
    ],
    last: "Nov 9: Marco asked for a clearer YamaMi path to profit.",
  },
  council: {
    goal: "Hear seller reactions to Seller Fees v2 before the Dec 1 launch.",
    with: "12 sellers · Lucía hosts",
    ctx: [
      { src: "FRESHDESK", t: "9 seller tickets about fees this month, mostly confusion over old tiers" },
      { src: "CLICKUP", t: "Seller Fees v2 · launch Dec 1" },
    ],
    last: "Oct: sellers asked for faster payouts. Shipped Nov 2.",
  },
  ana: {
    goal: "Telecom recovery plan and the renewal risk.",
    with: "Ana Ruiz, CDS Operations",
    ctx: [
      { src: "FRESHDESK", t: "#4821 past SLA · 5 related tickets in 3 days" },
      { src: "CLICKUP", t: "Renewal proposal draft due Friday" },
    ],
    last: "Nov 16: approved 2 new support hires; job post goes out Friday.",
  },
};

export const schedule: CalendarEvent[] = [
  { k: "standup", start: 8.5, end: 8.75, t: "08:30", title: "Leadership stand-up", dialTitle: "Stand-up", meta: "15 min · Google Meet", kind: "n", prep: prep.standup },
  { k: "", start: 9, end: 11, t: "09:00", title: "Focus block", dialTitle: "Focus block", meta: "Protected · read the board deck", kind: "focus" },
  { k: "board", start: 11, end: 11.75, t: "11:00", title: "Board prep with Marco", dialTitle: "Board prep", meta: "Deck not reviewed yet", kind: "flag", prep: prep.board },
  { k: "", start: 13, end: 14, t: "13:00", title: "Lunch", dialTitle: "Lunch", meta: "Blocked", kind: "lunch" },
  { k: "council", start: 14.5, end: 15.5, t: "14:30", title: "YamaMi seller council", dialTitle: "Seller council", meta: "1 h · 12 sellers", kind: "n", prep: prep.council },
  { k: "ana", start: 16, end: 16.5, t: "16:00", title: "1:1 with Ana", dialTitle: "1:1 with Ana", meta: "30 min · bring Telecom update", kind: "n", prep: prep.ana },
];

export const calendarFooter = "Last meeting ends 16:30. Evening is free.";

export const waiting: WaitingItem[] = [
  { id: "w1", who: "Marco Ruiz", role: "CFO", what: "Q4 cash forecast with the YamaMi scenario", asked: "Asked Nov 16 · ClickUp", due: "Nov 20", s: "late", label: "3 days late", energyLabel: "Cash forecast · late" },
  { id: "w2", who: "Kevin Marte", role: "CDS Support lead", what: "Root cause report for Caribbean Telecom #4821", asked: "Asked Sat · Freshdesk", due: "Today 12:00", s: "today", label: "Due today" },
  { id: "w3", who: "Andrés Soto", role: "Partnerships", what: "Legal redlines from the wallets partner", asked: "Asked Nov 19 · ClickUp", due: "Wed 25", s: "blocked", label: "Waiting on partner" },
  { id: "w4", who: "Luis Herrera", role: "Infrastructure", what: "Revised cutover plan after the circuit delay", asked: "Asked Nov 20 · ClickUp", due: "Wed 25", s: "ok", label: "On track" },
  { id: "w5", who: "Sofía Reyes", role: "Marketing", what: "Two YamaMi posts to fill the Dec 11 and Dec 18 slots", asked: "Asked Nov 20 · ClickUp", due: "Fri 27", s: "ok", label: "On track" },
  { id: "w6", who: "Lucía Gómez", role: "Marketplace", what: "One-page pricing summary for Seller Fees v2", asked: "Asked Nov 18 · ClickUp", due: "Delivered 07:05", s: "done", label: "✓ Delivered" },
];

const projects: (Project & { co: "CDS" | "YamaMi" })[] = [
  { id: "telecom", co: "CDS", s: "risk", name: "Caribbean Telecom renewal", line: "Open escalation is souring the renewal", pct: 40, next: "Renewal proposal · Dec 15", owner: "Ana Ruiz, CDS Ops", updated: "Updated 2h ago", latest: "Export failure traced to a firewall change on their side; fix is in testing. The client is more upset about weekend silence than the bug itself.", items: ["Hotfix to production · Tue", "Call with their CTO · needs you", "Renewal proposal draft · Fri"] },
  { id: "sla", co: "CDS", s: "ok", name: "Freshdesk SLA automation", line: "Auto-routing live for 60% of tickets", pct: 72, next: "Pilot with 3 clients · Dec 2", owner: "Kevin Marte, Support", updated: "Updated yesterday", latest: "Routing rules cut first-reply time by 22% in the test queue. Pilot clients confirmed.", items: ["Escalation rules · Wed", "Pilot kickoff · Dec 2"] },
  { id: "iso", co: "CDS", s: "ok", name: "ISO 27001 certification", line: "All controls documented", pct: 85, next: "External audit · Dec 9", owner: "Rosa Peña, Compliance", updated: "Updated Friday", latest: "Internal pre-audit passed with two minor findings, both closed.", items: ["Auditor logistics · Nov 30", "Staff awareness session · Dec 4"] },
  { id: "dc", co: "CDS", s: "watch", name: "Data center migration", line: "Two tasks slipped a week", pct: 55, next: "Cutover rehearsal · Jan 12", owner: "Luis Herrera, Infra", updated: "Updated 1d ago", latest: "Network vendor pushed the circuit install by a week. Cutover still holds if it lands by Dec 5.", items: ["Circuit install · Dec 5", "Backup restore test · Dec 10"] },
  { id: "fees", co: "YamaMi", s: "you", name: "Seller Fees v2", line: "Ready to ship, waiting on your pricing call", pct: 90, next: "Launch · Dec 1", owner: "Lucía Gómez, Marketplace", updated: "Updated 3h ago", latest: "Engineering and seller comms are done. Waiting only on the fee decision, which is on your list today.", items: ["Pricing decision · needs you", "Seller email · Nov 27"] },
  { id: "app", co: "YamaMi", s: "watch", name: "Mobile app 2.0", line: "14 open bugs in QA", pct: 35, next: "Beta · Dec 18", owner: "Diego Castillo, Product", updated: "Updated today", latest: "Bug count is falling (21 → 14 this week), but checkout still has 3 blockers.", items: ["Checkout blockers · Fri", "Beta tester list · Dec 10"] },
  { id: "holiday", co: "YamaMi", s: "ok", name: "Holiday campaign", line: "Creative in final round", pct: 60, next: "Creative review · Nov 26", owner: "Sofía Reyes, Marketing", updated: "Updated yesterday", latest: "42 sellers opted in, above the target of 30.", items: ["Final creative · Nov 26", "Go live · Dec 3"] },
  { id: "wallets", co: "YamaMi", s: "ok", name: "Local wallets partnership", line: "Terms agreed, legal reviewing", pct: 20, next: "Contract signing · Nov 30", owner: "Andrés Soto, Partnerships", updated: "Updated Thursday", latest: "Partner accepted our revenue-share terms. Legal redlines expected Wednesday.", items: ["Legal redlines · Wed", "Signing · Nov 30"] },
];

const RANK = { risk: 0, you: 1, watch: 2, ok: 3 } as const;
export const projectGroups: BriefData["projectGroups"] = [
  { co: "CDS" as const, label: "Caribglobal Data Services" },
  { co: "YamaMi" as const, label: "YamaMi" },
].map((g) => ({
  label: g.label,
  items: projects
    .filter((p) => p.co === g.co)
    .sort((a, b) => RANK[a.s] - RANK[b.s])
    .map(({ co: _co, ...p }) => p),
}));

export const clients: Client[] = [
  { name: "Caribbean Telecom", sector: "Telecom", value: "$180k", valueK: 180, date: "Dec 15", daysOut: 22, h: "risk", signal: "Escalation past SLA; 5 tickets in 3 days (usually 1 a week).", move: "Call their CTO this week; on your list today.", runway: { top: true, anchor: "c" } },
  { name: "Grupo Altamar", sector: "Hospitality", value: "$95k", valueK: 95, date: "Dec 31", daysOut: 38, h: "ok", signal: "Verbal yes on Nov 18. Paperwork is with their legal team.", move: "Nothing needed from you.", runway: { top: false, anchor: "r" } },
  { name: "Medi-Caribe Labs", sector: "Healthcare", value: "$60k", valueK: 60, date: "Jan 5", daysOut: 43, h: "watch", signal: "Ticket volume doubled this month; satisfaction down to 3.9.", move: "Kevin is reviewing their tickets; report by Fri.", runway: { top: true, anchor: "r" } },
  { name: "Banco del Sur", sector: "Banking", value: "$240k", valueK: 240, date: "Jan 10", daysOut: 48, h: "watch", signal: "Our main contact, their IT director, left Nov 12. No relationship with the successor yet.", move: "Suggest: a short intro call from you.", runway: { top: false, anchor: "l" } },
  { name: "Isla Seguros", sector: "Insurance", value: "$130k", valueK: 130, date: "Jan 20", daysOut: 58, h: "ok", signal: "Usage up 18%. Asked about adding analytics.", move: "Upsell opportunity; Ana is preparing a proposal.", runway: { top: true, anchor: "r" } },
];

export const runwayAxis = [
  { t: "Today", left: 0, tx: "none" },
  { t: "Dec 8", left: 25, tx: "translateX(-50%)" },
  { t: "Dec 23", left: 50, tx: "translateX(-50%)" },
  { t: "Jan 7", left: 75, tx: "translateX(-50%)" },
  { t: "Jan 22", left: 100, tx: "translateX(-100%)" },
];

export const channels = {
  you: { label: "YOU", short: "YOU", name: "Your profile", account: "Bionda Fonseca", initials: "BF", fg: "#C4A1FF", tint: "rgba(167,123,250,.15)" },
  cds: { label: "CDS", short: "CDS", name: "CDS page", account: "Caribglobal Data Services", initials: "CD", fg: "#6FA4FA", tint: "rgba(76,141,246,.14)" },
  ymi: { label: "YAMAMI", short: "YMI", name: "YamaMi page", account: "YamaMi", initials: "YM", fg: "#F48FC4", tint: "rgba(244,114,182,.14)" },
} as const;

type PostRow = [string, 11 | 12, number, string, string, Post["ch"], string, string, Post["base"], string, string, string?];

const postRows: PostRow[] = [
  ["p1", 11, 30, "MON", "09:00", "you", "What 20 years in Caribbean data taught me about trust", "Sofía", "ready", "", "Twenty years ago, most companies in our region sent their data abroad because there was no other option. Today there is. The biggest lesson since then: trust is not a feature you ship. It is a habit you keep, ticket by ticket, call by call.", "Post · trust"],
  ["p2", 11, 30, "MON", "12:00", "cds", "ISO 27001: why we are doing it, and what it means for clients", "Rosa", "approved", "", "Next month we sit our ISO 27001 audit. For clients, it means an independent check on how we protect their data, not just our word for it."],
  ["p3", 12, 1, "TUE", "10:00", "ymi", "Seller Fees v2 is live: simpler, fairer pricing", "Lucía", "ready", "waits on today’s pricing call", "One flat fee, no surprises. From today, every YamaMi seller pays the same simple rate, so more of each sale stays with the people who made it.", "Post · Seller Fees"],
  ["p4", 12, 2, "WED", "09:30", "cds", "How we cut first-reply time by 22% with automation", "Kevin", "ready", "", "Our support team now routes most tickets automatically to the right person. The result: clients hear back 22% faster, and our engineers spend less time sorting and more time solving.", "Post · reply time"],
  ["p5", 12, 2, "WED", "18:00", "you", "Why I shop local this season", "Sofía", "draft", "Sofía finishes Thu", ""],
  ["p6", 12, 3, "THU", "11:00", "ymi", "Holiday campaign: 42 local sellers, one marketplace", "Sofía", "ready", "", "This season, 42 local makers are on YamaMi’s holiday shelf: sauces, ceramics, coffee, clothing. Every order goes straight to a small business on the island.", "Post · holiday"],
  ["p7", 12, 4, "FRI", "09:00", "cds", "We are hiring support engineers in Santo Domingo", "Ana", "approved", "", "We are growing our support team. If you like solving real problems for real clients, we would love to meet you."],
  ["p8", 12, 4, "FRI", "15:00", "ymi", "Seller spotlight: Doña Marta’s hot sauces", "Sofía", "ready", "", "Doña Marta started with three bottles at a weekend market. Today she ships across the island through YamaMi. Here is her story.", "Post · Doña Marta"],
  ["p9", 12, 7, "MON", "09:00", "you", "Running two companies: what I stopped doing myself", "Sofía", "ready", "", "Leading CDS and YamaMi at the same time taught me one thing fast: my calendar is the strategy. Here are the three things I no longer do myself, and who does them better."],
  ["p10", 12, 8, "TUE", "10:00", "cds", "Moving our data center with zero downtime", "Luis", "draft", "Luis drafting", ""],
  ["p11", 12, 9, "WED", "11:00", "ymi", "Gift guide: 10 makers from across the island", "Sofía", "ready", "", "Ten gifts, ten makers, one marketplace. Our holiday gift guide is live."],
  ["p12", 12, 10, "THU", "09:30", "cds", "Audit week: behind the scenes of ISO 27001", "Rosa", "draft", "after the audit", ""],
  ["g1", 12, 11, "FRI", "", "ymi", "Empty slot", "", "gap", "", ""],
  ["p13", 12, 14, "MON", "09:00", "you", "Three people shaping Caribbean tech", "Sofía", "draft", "", ""],
  ["p14", 12, 16, "WED", "10:00", "cds", "Our clients’ year in five wins", "Kevin", "draft", "", ""],
  ["p15", 12, 17, "THU", "11:00", "ymi", "Last order dates for Christmas delivery", "Sofía", "approved", "", ""],
  ["g2", 12, 18, "FRI", "", "ymi", "Empty slot", "", "gap", "", ""],
  ["p16", 12, 21, "MON", "09:00", "you", "A thank-you to both teams", "Sofía", "draft", "", ""],
  ["p17", 12, 23, "WED", "10:00", "ymi", "Holiday support hours", "Mateo", "approved", "", ""],
  ["p18", 12, 29, "TUE", "10:00", "cds", "2027: what comes next for CDS", "Sofía", "draft", "", ""],
];

export const posts: Post[] = postRows.map(([id, m, d, dow, time, ch, title, by, base, note, body, energyLabel]) => ({
  id, m, d, dow, time, ch, title, by, base, note, body, energyLabel,
}));

/** Other open threads that pull at attention (energy visual only). */
export const otherPulls: BriefData["otherPulls"] = [
  { c: "#F5B13D", t: "Data center" },
  { c: "#F5B13D", t: "App 2.0 bugs" },
  { c: "#F5B13D", t: "Banco del Sur" },
];

export const supportSummary = {
  lead: "Mostly on time.",
  text: "97% of tickets across both teams were answered within SLA. One person is behind, and Kevin has already rebalanced his queue.",
};

export const supportTeams: SupportTeam[] = [
  {
    label: "CDS support",
    headline: "37 open · 6 overdue",
    status: "1 person slipping",
    tone: "amber",
    metrics: [
      { k: "Within SLA", v: "96%", tone: "mint" },
      { k: "Avg 1st reply", v: "1h12" },
      { k: "Avg to solve", v: "9h40" },
      { k: "Overdue", v: "6", tone: "amber" },
    ],
    trend: [97, 98, 96, 99, 93, 94, 96],
    agents: [
      { name: "Kevin Marte", sub: "Team lead", open: 8, solved: 34, firstReply: "0h48", firstReplyLate: false, sla: 99, status: "ok" },
      { name: "Yesenia Díaz", sub: "Support engineer", open: 9, solved: 31, firstReply: "1h05", firstReplyLate: false, sla: 98, status: "ok" },
      { name: "Pedro Almonte", sub: "Support engineer", open: 6, solved: 27, firstReply: "1h10", firstReplyLate: false, sla: 97, status: "ok" },
      { name: "Carlos Núñez", sub: "6 overdue · 5 are Caribbean Telecom", subTone: "amber", open: 14, solved: 22, firstReply: "2h35", firstReplyLate: true, sla: 88, status: "slip" },
    ],
    noteTag: "Handled",
    note: "Kevin moved 4 of Carlos’s other tickets to Pedro at 07:15, so Carlos can focus on Caribbean Telecom. Expect him back on time by Wednesday.",
    noteTone: "mint",
  },
  {
    label: "YamaMi support",
    headline: "21 open · 1 overdue",
    status: "On time",
    tone: "mint",
    metrics: [
      { k: "Within SLA", v: "98%", tone: "mint" },
      { k: "Avg 1st reply", v: "0h41" },
      { k: "Avg to solve", v: "5h05" },
      { k: "Overdue", v: "1" },
    ],
    trend: [99, 98, 97, 99, 96, 97, 98],
    agents: [
      { name: "Laura Pimentel", sub: "Team lead", open: 7, solved: 41, firstReply: "0h32", firstReplyLate: false, sla: 100, status: "ok" },
      { name: "Mateo Ortiz", sub: "Buyer & seller support", open: 8, solved: 36, firstReply: "0h51", firstReplyLate: false, sla: 98, status: "ok" },
      { name: "Nicole Vargas", sub: "Week 2 of onboarding", subTone: "blue", open: 6, solved: 18, firstReply: "2h10", firstReplyLate: true, sla: 93, status: "ramp" },
    ],
    noteTag: "Expected",
    note: "Nicole is in her second week. Her reply time is improving every day (3h20 on Tuesday, 2h10 yesterday). Laura is pairing with her.",
    noteTone: "blue",
  },
];

export const pastDecisions: Decision[] = [
  { day: "FRI 20", what: "Freeze Mobile app 2.0 scope until the beta", told: "Told: Diego, product team", src: "CLICKUP" },
  { day: "THU 19", what: "Hire 2 support engineers for CDS", told: "Told: Ana, HR", src: "CLICKUP" },
  { day: "WED 18", what: "Add $8k to the holiday campaign for seller ads", told: "Told: Sofía", src: "CLICKUP" },
  { day: "TUE 17", what: "Decline Altamar’s discount; offer a 3-month extension instead", told: "Told: Ana, Kevin", src: "FRESHDESK" },
];

export const pulse = [
  { co: "YamaMi", v: "−14%", tone: "amber" as const, text: "weekend orders vs. a normal weekend. Payments were down Sat 14:00–16:00; fixed, orders recovering." },
  { co: "CDS", v: "Normal", tone: "mint" as const, text: "revenue, usage and new deals all in range." },
];

export const checks: Check[] = [
  { source: "Freshdesk · CDS", title: "CDS support", verdict: "96% answered on time. Details in Support team; the one escalation is on your list.", ok: true, metrics: [{ v: "37", k: "open" }, { v: "96%", k: "in SLA" }, { v: "1h12", k: "1st reply" }] },
  { source: "Freshdesk · YamaMi", title: "YamaMi support", verdict: "Quiet weekend. No breaches, buyers happy.", ok: true, metrics: [{ v: "21", k: "open" }, { v: "0", k: "breaches" }, { v: "4.7", k: "CSAT" }] },
  { source: "ClickUp", title: "Team tasks", verdict: "6 overdue, all owned and re-dated. None block a launch.", ok: true, metrics: [{ v: "146", k: "open" }, { v: "6", k: "overdue" }, { v: "31", k: "closed" }] },
  { source: "LinkedIn", title: "Posting", verdict: "You and CDS are on pace. YamaMi is 2 behind; Sofía has both queued.", ok: false, metrics: [{ v: "2/2", k: "you" }, { v: "3/3", k: "CDS" }, { v: "1/3", k: "YamaMi" }] },
  { source: "Calendar", title: "This week", verdict: "14 meetings, 6 hours of focus protected. Thursday is light.", ok: true, metrics: [{ v: "14", k: "meetings" }, { v: "6h", k: "focus" }, { v: "Thu", k: "lightest" }] },
];

/** Section 06 sample — verbatim from design v2 (Bionda_Dashboard_v2). */
const liRaw: [string, string, string, number, number, number, number, number, number][] = [
  ["Where your data lives: Caribbean data sovereignty", "Wed 18 Nov", "Carousel", 14200, 486, 72, 61, 7.8, 18],
  ["Case study: Isla Seguros cut reporting time by 40%", "Tue 10 Nov", "Image", 9800, 312, 41, 28, 6.1, 10],
  ["Meet the team behind 98% on-time support", "Wed 4 Nov", "Video", 8100, 264, 38, 12, 5.2, 4],
  ["CDS at Caribbean Tech Summit 2026", "Fri 30 Oct", "Image", 6400, 158, 14, 9, 3.4, -1],
  ["Cloud backup checklist for small businesses", "Fri 13 Nov", "Document", 5200, 96, 7, 15, 2.6, 13],
  ["Q4 product update", "Fri 6 Nov", "Text", 3100, 41, 3, 2, 1.3, 6],
];
export const linkedinSample: BriefData["linkedin"] = {
  page: { name: "Caribglobal Data Services", label: "CDS", url: "https://www.linkedin.com/company/", followers: 8412, growthPct: 4.8 },
  syncedAt: "06:38",
  lead: "Growing, and faster.",
  summary: "CDS gained 387 followers in 30 days, 40% more than the month before. Engagement is up to 4.6%, carried by the data sovereignty carousel. One gap: only 6 of 8 planned posts went out.",
  kpis: [
    { k: "Followers", v: "8,412", d: "+387", dk: "+4.8% in 30 days", tone: "mint" },
    { k: "Impressions", v: "52.4k", d: "+22%", dk: "vs 43.0k", tone: "mint" },
    { k: "Engagement rate", v: "4.6%", d: "+1.2 pts", dk: "vs 3.4%", tone: "mint" },
    { k: "Posts published", v: "6", d: "2 short", dk: "of 8 planned", tone: "amber" },
  ],
  weeks: [48, 52, 61, 44, 58, 70, 66, 82, 74, 91, 118, 104].map((v, i) => ({ v, l: ["Sep 7", "", "", "Sep 28", "", "", "Oct 19", "", "", "Nov 9", "", "Nov 23"][i] })),
  pace: { last: 387, before: 276 },
  works: [
    { t: "Real client results win.", d: "The Isla Seguros case study got 2× the engagement of the summit and product announcements." },
    { t: "Show, don’t tell.", d: "Carousels and video averaged 6.5% engagement. The text-only update got 1.3%." },
    { t: "Mid-week beats Friday.", d: "The top 3 went out Tue–Wed mornings. Friday posts averaged 2.4%." },
  ],
  next: "2 of 3 CDS posts fit the pattern. The Friday hiring post may get half the reach; Tue 8 Dec would suit it better.",
  bestLabel: "Best this quarter",
  avgRate: 4.6,
  posts: liRaw.map(([title, date, format, impressions, reactions, comments, reposts, rate, dayOfNov], i) => ({
    id: `li-sample-${i}`,
    title,
    date,
    format,
    publishedAt: Date.UTC(2026, 10, dayOfNov, 13),
    impressions,
    reactions,
    comments,
    reposts,
    rate,
  })),
};

/** The full sample brief — what the page shows when no integration is configured. */
export const mockBrief: BriefData = {
  needs,
  waiting,
  waitingPills: [
    { t: "● 1 late", tone: "red" },
    { t: "2 due by Wednesday", tone: "amber" },
    { t: "2 on track", tone: "mint" },
    { t: "✓ 1 delivered", tone: "grey" },
  ],
  projectGroups,
  pastDecisions,
  checks,
  sources,
  otherPulls,
  linkedin: linkedinSample,
};
