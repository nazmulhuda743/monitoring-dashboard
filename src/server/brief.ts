import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { mockBrief } from "@/data/brief";
import type { BriefData, SourceInfo } from "@/data/types";
import { formatBusinessTime } from "@/lib/business-time";
import { clickUpConfigFromEnv, loadClickUp } from "./clickup";
import { mapLinkedInCheck } from "./linkedin/adapt";
import { linkedInConfigFromEnv, loadLinkedIn } from "./linkedin";
import { getStore } from "./store";

/**
 * The page's data. Each integration replaces its part of the sample brief;
 * anything not connected (or failing) keeps the sample data, so the page
 * always renders.
 *
 * Cached with the "brief" profile (next.config.ts): served instantly, refreshed
 * in the background about every 2 minutes.
 */
export async function getBriefData(): Promise<BriefData> {
  "use cache";
  cacheLife("brief");
  cacheTag("brief"); // revalidated when LinkedIn gets connected
  return buildBrief(Date.now());
}

export async function buildBrief(now: number, env: Record<string, string | undefined> = process.env): Promise<BriefData> {
  const data: BriefData = structuredClone(mockBrief);
  const setSource = (name: SourceInfo["name"], patch: Partial<SourceInfo>) => {
    data.sources = data.sources.map((s) => (s.name === name ? { ...s, ...patch } : s));
  };

  const cfg = clickUpConfigFromEnv(env);
  if (cfg) {
    try {
      const cu = await loadClickUp(cfg, now);
      // Live ClickUp items replace the sample ClickUp items; other sources stay.
      data.needs = [...data.needs.filter((n) => !n.source.startsWith("ClickUp")), ...cu.needs];
      data.waiting = [...data.waiting.filter((w) => !w.asked.includes("ClickUp")), ...cu.waiting];
      data.waitingPills = undefined; // derive from the live list
      data.projectGroups = cu.projectGroups;
      data.pastDecisions = [...cu.decisions, ...data.pastDecisions.filter((d) => d.src !== "CLICKUP")];
      data.checks = data.checks.map((c) => (c.source === "ClickUp" ? cu.teamCheck : c));
      // Energy visual: projects that need watching instead of the sample ones.
      data.otherPulls = [
        ...cu.projectGroups.flatMap((g) => g.items).filter((p) => p.s === "risk" || p.s === "watch").slice(0, 3).map((p) => ({ c: p.s === "risk" ? "#F26B5E" : "#F5B13D", t: p.name.length > 18 ? `${p.name.slice(0, 17)}…` : p.name })),
        ...data.otherPulls.filter((p) => p.t === "Banco del Sur"), // from Key clients (not ClickUp)
      ];
      setSource("ClickUp", { state: "live", t: formatBusinessTime(new Date(now)) });
    } catch (err) {
      console.error("[brief] ClickUp failed, showing sample data:", err instanceof Error ? err.message : err);
      setSource("ClickUp", { state: "error" });
    }
  }
  const li = linkedInConfigFromEnv(env);
  if (li) {
    try {
      const r = await loadLinkedIn(li, getStore(env), now);
      if (r.summary) {
        data.linkedin = r.summary;
        const check = mapLinkedInCheck(r.summary, now);
        data.checks = data.checks.map((c) => (c.source === "LinkedIn" ? check : c));
      }
      if (r.state === "live") setSource("LinkedIn", { state: r.action ? "setup" : "live", t: formatBusinessTime(new Date(r.fetchedAt)), action: r.action });
      else if (r.state === "setup") setSource("LinkedIn", { state: "setup", action: r.action });
      else setSource("LinkedIn", { state: "error" });
    } catch (err) {
      console.error("[brief] LinkedIn failed:", err instanceof Error ? err.message : err);
      setSource("LinkedIn", { state: "error" });
    }
  }
  return data;
}
