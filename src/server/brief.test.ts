import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mockBrief } from "@/data/brief";
import { NOW } from "@/test/clickup-fixtures";
import { FAKE_TOKEN, startFakeClickUp } from "@/test/fake-clickup";
import { buildBrief } from "./brief";

let fake: Awaited<ReturnType<typeof startFakeClickUp>>;
beforeAll(async () => {
  fake = await startFakeClickUp();
});
afterAll(() => fake.server.close());

const env = (token = FAKE_TOKEN) => ({ CLICKUP_API_TOKEN: token, CLICKUP_API_URL: fake.url });

describe("buildBrief", () => {
  it("without a token shows the sample brief unchanged", async () => {
    const d = await buildBrief(NOW, {});
    expect(d).toEqual(mockBrief);
    expect(d.sources.find((s) => s.name === "ClickUp")?.state).toBe("mock");
  });

  it("with ClickUp: live ClickUp items replace the sample ClickUp items only", async () => {
    const d = await buildBrief(NOW, env());

    // Needs: sample Freshdesk/Calendar/LinkedIn items stay, sample ClickUp one is replaced.
    expect(d.needs.map((n) => n.source)).toEqual([
      "Freshdesk · CDS",
      "Calendar",
      "LinkedIn · Personal",
      "ClickUp · Caribglobal Data Services",
      "ClickUp · YamaMi",
    ]);
    // Waiting: only live ClickUp hand-offs (sample had no non-ClickUp ones... except Freshdesk).
    expect(d.waiting.filter((w) => w.asked.includes("Freshdesk")).map((w) => w.who)).toEqual(["Kevin Marte"]);
    expect(d.waiting.filter((w) => w.id.startsWith("cu-")).length).toBe(5);
    expect(d.waitingPills).toBeUndefined();

    // Projects come from ClickUp spaces/lists.
    expect(d.projectGroups.map((g) => g.label)).toEqual(["Caribglobal Data Services", "YamaMi"]);
    expect(d.projectGroups[0].items[0]).toMatchObject({ name: "Caribbean Telecom renewal", s: "risk" });

    // Decisions: live ClickUp + sample Freshdesk.
    expect(d.pastDecisions.map((x) => x.src)).toEqual(["CLICKUP", "FRESHDESK"]);

    // Team card + source status (sync time in Curaçao).
    expect(d.checks.find((c) => c.source === "ClickUp")?.verdict).toBe("3 overdue, 1 with no owner.");
    expect(d.sources.find((s) => s.name === "ClickUp")).toEqual({ name: "ClickUp", t: "09:37", state: "live" });
    expect(d.sources.find((s) => s.name === "Freshdesk")?.state).toBe("mock");
  });

  it("on a bad token keeps the sample brief and marks ClickUp as error", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const d = await buildBrief(NOW, env("pk_wrong"));
    expect(d.needs).toEqual(mockBrief.needs);
    expect(d.sources.find((s) => s.name === "ClickUp")?.state).toBe("error");
    expect(err).toHaveBeenCalledWith(expect.stringContaining("ClickUp failed"), expect.stringContaining("401"));
    err.mockRestore();
  });

  it("stays well under ClickUp's rate limit", async () => {
    fake.calls.length = 0;
    await buildBrief(NOW, env());
    expect(fake.calls.length).toBeLessThan(30);
  });
});
