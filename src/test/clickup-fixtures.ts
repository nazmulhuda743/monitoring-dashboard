/**
 * A small fake ClickUp workspace for tests and local demos.
 * "Now" is Monday 23 Nov 2026, 09:37 Curaçao (13:37 UTC).
 */
import type { CUFolder, CUList, CUSpace, CUTask, CUUser } from "@/server/clickup/api";

export const NOW = Date.parse("2026-11-23T09:37:00-04:00");
/** Curaçao wall-clock → epoch ms string, as ClickUp returns dates. */
const at = (iso: string) => String(Date.parse(`${iso}-04:00`));

export const ME: CUUser = { id: 1, username: "Bionda Fonseca", email: "bionda@example.com" };
const U = (id: number, username: string): CUUser => ({ id, username });
const MARCO = U(2, "Marco Ruiz");
const KEVIN = U(3, "Kevin Marte");
const ANDRES = U(4, "Andrés Soto");
const LUIS = U(5, "Luis Herrera");
const LUCIA = U(6, "Lucía Gómez");
const ANA = U(7, "Ana Ruiz");

export const SPACES: CUSpace[] = [
  { id: "s-cds", name: "Caribglobal Data Services" },
  { id: "s-ymi", name: "YamaMi" },
];

const L = (id: string, name: string, space: string, extra: Partial<CUList> = {}): CUList => ({
  id,
  name,
  content: null,
  status: null,
  assignee: null,
  due_date: null,
  ...extra,
  space: { id: space, name: SPACES.find((s) => s.id === space)!.name },
});

export const LISTS = {
  telecom: L("l-tel", "Caribbean Telecom renewal", "s-cds", { status: { status: "at risk" }, assignee: ANA, content: "Open escalation is souring the renewal. More text here." }),
  iso: L("l-iso", "ISO 27001 certification", "s-cds"),
  fees: L("l-fees", "Seller Fees v2", "s-ymi"),
  ops: L("l-ops", "Ops backlog", "s-ymi"),
};

export const FOLDERS: Record<string, CUFolder[]> = {
  "s-cds": [{ id: "f-cds", name: "Clients", lists: [LISTS.telecom, LISTS.iso] }],
  "s-ymi": [],
};
export const FOLDERLESS: Record<string, CUList[]> = { "s-cds": [], "s-ymi": [LISTS.fees, LISTS.ops] };

let n = 0;
function T(p: Omit<Partial<CUTask>, "list"> & { name: string; list: CUList }): CUTask {
  n++;
  const { list, ...rest } = p;
  return {
    id: `t${n}`,
    text_content: null,
    status: { status: "to do", type: "open" },
    date_created: at("2026-11-16T10:00"),
    date_updated: at("2026-11-22T10:00"),
    date_closed: null,
    date_done: null,
    creator: ME,
    assignees: [ME],
    due_date: null,
    priority: null,
    tags: [],
    url: `https://app.clickup.com/t/t${n}`,
    folder: { id: "f", name: "hidden", hidden: true },
    space: { id: list.space!.id },
    ...rest,
    list: { id: list.id, name: list.name },
  };
}
const done = (when: string): Pick<CUTask, "status" | "date_done" | "date_closed" | "date_updated"> => ({ status: { status: "complete", type: "closed" }, date_done: at(when), date_closed: at(when), date_updated: at(when) });

export const TASKS = {
  // Needs you
  overdueMine: T({ name: "Call Caribbean Telecom CTO", list: LISTS.telecom, due_date: at("2026-11-20T17:00"), priority: { priority: "urgent" }, text_content: "Export failing since Friday. They want to hear from you." }),
  todayMine: T({ name: "Decide seller fee pricing", list: LISTS.fees, due_date: at("2026-11-23T17:00") }),
  tomorrowMine: T({ name: "Review board deck v4", list: LISTS.iso, due_date: at("2026-11-24T09:00") }),
  // Waiting on others (created by me)
  late: T({ name: "Q4 cash forecast with the YamaMi scenario", list: LISTS.ops, assignees: [MARCO], due_date: at("2026-11-20T12:00"), date_created: at("2026-11-16T09:00") }),
  dueToday: T({ name: "Root cause report for #4821", list: LISTS.telecom, assignees: [KEVIN], due_date: at("2026-11-23T12:00") }),
  blocked: T({ name: "Legal redlines from the wallets partner", list: LISTS.ops, assignees: [ANDRES], status: { status: "waiting on partner", type: "custom" }, due_date: at("2026-11-25T12:00") }),
  onTrack: T({ name: "Revised cutover plan", list: LISTS.iso, assignees: [LUIS], status: { status: "in progress", type: "custom" }, due_date: at("2026-11-25T12:00") }),
  notMine: T({ name: "Someone else's hand-off", list: LISTS.ops, creator: KEVIN, assignees: [LUIS] }),
  // Done
  delivered: T({ name: "One-page pricing summary", list: LISTS.fees, assignees: [LUCIA], ...done("2026-11-23T07:05") }),
  decision: T({ name: "Freeze Mobile app 2.0 scope until the beta", list: LISTS.fees, assignees: [LUCIA, ANA], tags: [{ name: "Decision" }], ...done("2026-11-20T15:00") }),
  oldDone: T({ name: "Old closed thing", list: LISTS.iso, ...done("2026-11-02T10:00") }),
  unownedOverdue: T({ name: "Orphan overdue task", list: LISTS.ops, assignees: [], due_date: at("2026-11-21T10:00") }),
};

export const ALL_TASKS: CUTask[] = Object.values(TASKS);
export const isClosedTask = (t: CUTask) => t.status.type === "closed" || t.status.type === "done";
export const OPEN_TASKS = ALL_TASKS.filter((t) => !isClosedTask(t));
