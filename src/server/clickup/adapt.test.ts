import { describe, expect, it } from "vitest";
import { ALL_TASKS, LISTS, ME, NOW, OPEN_TASKS, SPACES, TASKS } from "@/test/clickup-fixtures";
import { mapDecisions, mapNeeds, mapProject, mapProjectGroups, mapTeamCheck, mapWaiting, statusFromText } from "./adapt";

const spaceNames = Object.fromEntries(SPACES.map((s) => [s.id, s.name]));
/** What the loader asks ClickUp for: done in the last 7 days. */
const weekDone = ALL_TASKS.filter((t) => t.date_done && Number(t.date_done) > NOW - 7 * 86400000);

describe("mapNeeds (assigned to me, due by end of today in Curaçao)", () => {
  const needs = mapNeeds(OPEN_TASKS, ME, NOW, spaceNames);

  it("includes overdue + due-today tasks only, most urgent first", () => {
    expect(needs.map((n) => n.title)).toEqual(["Call Caribbean Telecom CTO", "Decide seller fee pricing"]);
  });
  it("labels overdue in Curaçao days and colors it red", () => {
    expect(needs[0]).toMatchObject({ due: "Overdue 3 days", overdue: true, tone: "red", source: "ClickUp · Caribglobal Data Services", url: TASKS.overdueMine.url });
    expect(needs[0].why).toBe("Export failing since Friday.");
  });
  it("shows today's due time in Curaçao", () => {
    expect(needs[1]).toMatchObject({ due: "Today, 17:00", overdue: false, tone: "amber", source: "ClickUp · YamaMi" });
  });
  it("does not include other people's tasks", () => {
    expect(mapNeeds(OPEN_TASKS, { id: 999, username: "x" }, NOW, spaceNames)).toEqual([]);
  });
});

describe("mapWaiting (I created, someone else owns)", () => {
  const w = mapWaiting(OPEN_TASKS, weekDone, ME, NOW);

  it("orders late → today → blocked → on track → delivered", () => {
    expect(w.map((x) => [x.who, x.s, x.label])).toEqual([
      ["Marco Ruiz", "late", "3 days late"],
      ["Kevin Marte", "today", "Due today"],
      ["Andrés Soto", "blocked", "Waiting · waiting on partner"],
      ["Luis Herrera", "ok", "On track"],
      ["Lucía Gómez", "done", "✓ Delivered"],
    ]);
  });
  it("formats dates in Curaçao", () => {
    expect(w[0]).toMatchObject({ asked: "Asked Nov 16 · ClickUp", due: "Fri 20" });
    expect(w[1].due).toBe("Today 12:00");
    expect(w[4].due).toBe("Delivered 07:05");
  });
  it("skips hand-offs made by other people", () => {
    expect(w.some((x) => x.what === "Someone else's hand-off")).toBe(false);
  });
});

describe("project health", () => {
  it("reads the ClickUp list status when the team uses one", () => {
    expect(statusFromText("At Risk")).toBe("risk");
    expect(statusFromText("on track")).toBe("ok");
    expect(statusFromText("Needs decision")).toBe("you");
    expect(statusFromText("on hold")).toBe("watch");
    expect(statusFromText("in progress")).toBeNull();
  });

  it("derives health from tasks otherwise", () => {
    const fees = mapProject({ id: "l-fees", name: "Seller Fees v2", url: "u", tasks: ALL_TASKS.filter((t) => t.list.id === LISTS.fees.id) }, ME, NOW);
    expect(fees.s).toBe("you"); // has a task of mine due within a week
    expect(fees.pct).toBe(67); // 2 of 3 closed
    expect(fees.next).toBe("Decide seller fee pricing · Nov 23");

    const ops = mapProject({ id: "l-ops", name: "Ops", url: "u", tasks: ALL_TASKS.filter((t) => t.list.id === LISTS.ops.id) }, ME, NOW);
    expect(ops.s).toBe("risk"); // 2 of 4 open tasks overdue (> 25%)

    const oneLate = mapProject({ id: "x", name: "x", url: "u", tasks: [TASKS.late] }, { id: 42, username: "other" }, NOW);
    expect(oneLate.s).toBe("watch"); // a single overdue task is not "at risk"
  });

  it("groups by space, worst first, and uses list status", () => {
    const groups = mapProjectGroups(
      [
        { label: "Caribglobal Data Services", units: [LISTS.telecom, LISTS.iso].map((l) => ({ id: l.id, name: l.name, content: l.content, status: l.status?.status, owner: l.assignee, url: "u", tasks: ALL_TASKS.filter((t) => t.list.id === l.id) })) },
      ],
      ME,
      NOW,
    );
    expect(groups[0].items.map((p) => [p.name, p.s, p.owner])).toEqual([
      ["Caribbean Telecom renewal", "risk", "Ana Ruiz"],
      ["ISO 27001 certification", "you", "Luis Herrera"],
    ]);
    expect(groups[0].items[0].line).toBe("Open escalation is souring the renewal.");
  });
});

describe("decisions and team card", () => {
  it("lists tasks tagged 'decision' (any case) done in the last 7 days, with Curaçao day", () => {
    expect(mapDecisions(weekDone, "decision")).toEqual([
      { day: "FRI 20", what: "Freeze Mobile app 2.0 scope until the beta", told: "Told: Lucía Gómez, Ana Ruiz", src: "CLICKUP" },
    ]);
  });
  it("counts open / overdue / closed and flags unowned overdue work", () => {
    const c = mapTeamCheck(OPEN_TASKS, true, 2, NOW);
    expect(c.metrics).toEqual([
      { v: String(OPEN_TASKS.length), k: "open" },
      { v: "3", k: "overdue" },
      { v: "2", k: "closed" },
    ]);
    expect(c.ok).toBe(false);
    expect(c.verdict).toBe("3 overdue, 1 with no owner.");
    expect(mapTeamCheck(OPEN_TASKS, false, 0, NOW).metrics[0].v).toBe(`${OPEN_TASKS.length}+`);
  });
});

describe("greeting (Curaçao hour)", async () => {
  const { greetingFor } = await import("@/lib/business-time");
  it("switches at 05:00, 12:00 and 17:00", () => {
    expect([4, 5, 11, 12, 16, 17, 23, 0].map(greetingFor)).toEqual(["evening", "morning", "morning", "afternoon", "afternoon", "evening", "evening", "evening"]);
  });
});
