import "server-only";

import type { Check, Decision, Need, ProjectGroup, WaitingItem } from "@/data/types";
import { mapDecisions, mapNeeds, mapProjectGroups, mapTeamCheck, mapWaiting, type ProjectUnit } from "./adapt";
import { createClickUpClient, type CUList, type CUSpace } from "./api";

/**
 * Settings, all from environment variables (set them in Vercel → Settings →
 * Environment Variables). Only the token is required.
 */
export interface ClickUpConfig {
  /** CLICKUP_API_TOKEN — personal token (pk_…) of Bionda's ClickUp user. */
  token: string;
  /** CLICKUP_TEAM_ID — workspace id; default: the first workspace. */
  teamId?: string;
  /** CLICKUP_SPACE_IDS — comma-separated spaces that hold projects; default: all. */
  spaceIds?: string[];
  /** CLICKUP_PROJECT_LEVEL — "list" (default) or "folder": what counts as one project. */
  projectLevel: "list" | "folder";
  /** CLICKUP_DECISION_TAG — tag that marks a task as a decision (default "decision"). */
  decisionTag: string;
  /** CLICKUP_MAX_PROJECTS — max projects shown (default 12). */
  maxProjects: number;
  /** CLICKUP_API_URL — only for tests (fake ClickUp). */
  baseUrl?: string;
}

export function clickUpConfigFromEnv(env: Record<string, string | undefined> = process.env): ClickUpConfig | null {
  const token = env.CLICKUP_API_TOKEN?.trim();
  if (!token) return null;
  const list = (v?: string) => v?.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    token,
    teamId: env.CLICKUP_TEAM_ID?.trim() || undefined,
    spaceIds: list(env.CLICKUP_SPACE_IDS),
    projectLevel: env.CLICKUP_PROJECT_LEVEL?.trim() === "folder" ? "folder" : "list",
    decisionTag: env.CLICKUP_DECISION_TAG?.trim() || "decision",
    maxProjects: Number(env.CLICKUP_MAX_PROJECTS) || 12,
    baseUrl: env.CLICKUP_API_URL?.trim() || undefined,
  };
}

export interface ClickUpBrief {
  needs: Need[];
  waiting: WaitingItem[];
  projectGroups: ProjectGroup[];
  decisions: Decision[];
  teamCheck: Check;
  workspace: string;
}

/** Run `fn` over `items` with at most `n` in flight (stay under rate limits). */
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

export async function loadClickUp(cfg: ClickUpConfig, now: number): Promise<ClickUpBrief> {
  const cu = createClickUpClient({ token: cfg.token, baseUrl: cfg.baseUrl });

  const [me, teams] = await Promise.all([cu.me(), cu.teams()]);
  const team = (cfg.teamId ? teams.find((t) => t.id === cfg.teamId) : teams[0]) ?? null;
  if (!team) throw new Error(cfg.teamId ? `ClickUp workspace ${cfg.teamId} not found for this token` : "This ClickUp token has no workspace");

  // "This week" = the last 7 days (on a Monday the design still lists Fri, Thu, …).
  const since = now - 7 * 86400000;
  const [spacesAll, openRes, doneRes] = await Promise.all([
    cu.spaces(team.id),
    cu.teamTasks(team.id, { include_closed: false, subtasks: true }, 10),
    cu.teamTasks(team.id, { include_closed: true, subtasks: true, date_done_gt: since }, 5),
  ]);
  const spaceNames = Object.fromEntries(spacesAll.map((s) => [s.id, s.name]));
  const spaces: CUSpace[] = cfg.spaceIds?.length ? spacesAll.filter((s) => cfg.spaceIds!.includes(s.id)) : spacesAll;

  // ---- Projects: discover lists/folders per space, keep the active ones, then load their tasks.
  const openByList = new Map<string, number>();
  openRes.tasks.forEach((t) => openByList.set(t.list.id, (openByList.get(t.list.id) ?? 0) + 1));
  const lastTouch = new Map<string, number>();
  [...openRes.tasks, ...doneRes.tasks].forEach((t) => {
    const u = Number(t.date_updated ?? t.date_created);
    lastTouch.set(t.list.id, Math.max(lastTouch.get(t.list.id) ?? 0, u));
  });

  const perSpace = await pool(spaces, 3, async (space) => {
    const [folders, loose] = await Promise.all([cu.folders(space.id), cu.folderlessLists(space.id)]);
    type Candidate = { id: string; name: string; content?: string | null; status?: string | null; owner?: CUList["assignee"]; url: string; listIds: string[] };
    const candidates: Candidate[] =
      cfg.projectLevel === "folder"
        ? folders
            .filter((f) => !f.hidden && !f.archived)
            .map((f) => ({ id: f.id, name: f.name, url: `https://app.clickup.com/${team.id}/v/f/${f.id}`, listIds: f.lists.map((l) => l.id) }))
        : [...folders.filter((f) => !f.archived).flatMap((f) => f.lists), ...loose]
            .filter((l) => !l.archived)
            .map((l) => ({ id: l.id, name: l.name, content: l.content, status: l.status?.status, owner: l.assignee, url: `https://app.clickup.com/${team.id}/v/li/${l.id}`, listIds: [l.id] }));
    return { space, candidates };
  });

  // Only lists/folders with open work or activity this week are "projects".
  const score = (ids: string[]) => Math.max(0, ...ids.map((id) => lastTouch.get(id) ?? 0));
  const active = perSpace
    .flatMap(({ space, candidates }) => candidates.map((c) => ({ space, c, touched: score(c.listIds), open: c.listIds.reduce((n, id) => n + (openByList.get(id) ?? 0), 0) })))
    .filter((x) => x.open > 0 || x.touched >= since)
    .sort((a, b) => b.touched - a.touched)
    .slice(0, cfg.maxProjects);

  const units = await pool(active, 4, async ({ space, c }) => {
    const tasks = (await Promise.all(c.listIds.map((id) => cu.listTasks(id)))).flat();
    const unit: ProjectUnit = { id: c.id, name: c.name, content: c.content, status: c.status, owner: c.owner, url: c.url, tasks };
    return { space: space.name, unit };
  });

  const groups = spaces
    .map((s) => ({ label: s.name, units: units.filter((u) => u.space === s.name).map((u) => u.unit) }))
    .filter((g) => g.units.length);

  return {
    needs: mapNeeds(openRes.tasks, me, now, spaceNames),
    waiting: mapWaiting(openRes.tasks, doneRes.tasks, me, now),
    projectGroups: mapProjectGroups(groups, me, now, cfg.maxProjects),
    decisions: mapDecisions(doneRes.tasks, cfg.decisionTag),
    teamCheck: mapTeamCheck(openRes.tasks, openRes.complete, doneRes.tasks.filter((t) => t.status.type === "closed" || t.status.type === "done").length, now),
    workspace: team.name,
  };
}
