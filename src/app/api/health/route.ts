import { getBriefData } from "@/server/brief";

/**
 * GET /api/health — is each integration live? Safe to share: never returns
 * tokens or task contents, only states, sync times (Curaçao) and counts.
 * Same 2-minute cache as the page.
 */
export async function GET() {
  const d = await getBriefData();
  const fromClickUp = <T extends { id: string }>(xs: T[]) => xs.filter((x) => x.id.startsWith("cu-")).length;
  return Response.json({
    timeZone: "America/Curacao",
    sources: d.sources,
    clickup: {
      needsYou: fromClickUp(d.needs),
      waitingOnOthers: fromClickUp(d.waiting),
      projects: d.projectGroups.reduce((n, g) => n + g.items.length, 0),
      decisionsThisWeek: d.pastDecisions.filter((x) => x.src === "CLICKUP").length,
    },
  });
}
