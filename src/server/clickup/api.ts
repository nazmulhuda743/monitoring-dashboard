import "server-only";

/**
 * Minimal ClickUp API v2 client (read-only). Server-only: the token must never
 * reach the browser. Docs: https://clickup.com/api (v2).
 */

// ---- Raw API shapes (only the fields we use) ----

export interface CUUser {
  id: number;
  username: string | null;
  email?: string;
  initials?: string;
}

export interface CUTask {
  id: string;
  name: string;
  text_content?: string | null;
  status: { status: string; type: string; color?: string };
  date_created: string;
  date_updated: string | null;
  date_closed: string | null;
  date_done: string | null;
  creator: CUUser;
  assignees: CUUser[];
  due_date: string | null;
  priority: { priority: string } | null;
  tags: { name: string }[];
  url: string;
  list: { id: string; name: string };
  folder: { id: string; name: string; hidden?: boolean };
  space: { id: string };
}

export interface CUList {
  id: string;
  name: string;
  content?: string | null;
  status: { status: string; color?: string } | null;
  assignee: CUUser | null;
  due_date: string | null;
  task_count?: number | null;
  archived?: boolean;
  folder?: { id: string; name: string; hidden?: boolean };
  space?: { id: string; name: string };
}

export interface CUFolder {
  id: string;
  name: string;
  hidden?: boolean;
  archived?: boolean;
  lists: CUList[];
}

export interface CUSpace {
  id: string;
  name: string;
}

export interface CUTeam {
  id: string;
  name: string;
}

// ---- Client ----

export class ClickUpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

export interface ClickUpClientOptions {
  token: string;
  /** Override for tests (a local fake ClickUp). */
  baseUrl?: string;
}

type Params = Record<string, string | number | boolean | (string | number)[] | undefined>;

function query(params: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(`${k}[]`, String(x)));
    else q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function createClickUpClient({ token, baseUrl = "https://api.clickup.com/api/v2" }: ClickUpClientOptions) {
  async function get<T>(path: string, params: Params = {}, attempt = 0): Promise<T> {
    const res = await fetch(`${baseUrl}${path}${query(params)}`, {
      headers: { Authorization: token, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429 && attempt < 2) {
      // Rate limited (100 req/min on most plans): wait until the reset, max 10s.
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const wait = Math.min(10000, Math.max(1000, reset ? reset - Date.now() : 2000));
      await new Promise((r) => setTimeout(r, wait));
      return get<T>(path, params, attempt + 1);
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ClickUpError(`ClickUp ${res.status} on ${path}: ${body.slice(0, 200)}`, res.status);
    }
    return (await res.json()) as T;
  }

  /** Paginated "filtered team tasks" (100 per page). */
  async function teamTasks(teamId: string, params: Params, maxPages = 10) {
    const tasks: CUTask[] = [];
    let complete = false;
    for (let page = 0; page < maxPages; page++) {
      const r = await get<{ tasks: CUTask[]; last_page?: boolean }>(`/team/${teamId}/task`, { ...params, page });
      tasks.push(...r.tasks);
      if (r.last_page !== false || r.tasks.length < 100) {
        complete = true;
        break;
      }
    }
    return { tasks, complete };
  }

  return {
    me: () => get<{ user: CUUser }>("/user").then((r) => r.user),
    teams: () => get<{ teams: CUTeam[] }>("/team").then((r) => r.teams),
    spaces: (teamId: string) => get<{ spaces: CUSpace[] }>(`/team/${teamId}/space`, { archived: false }).then((r) => r.spaces),
    folders: (spaceId: string) => get<{ folders: CUFolder[] }>(`/space/${spaceId}/folder`, { archived: false }).then((r) => r.folders),
    folderlessLists: (spaceId: string) => get<{ lists: CUList[] }>(`/space/${spaceId}/list`, { archived: false }).then((r) => r.lists),
    listTasks: async (listId: string, maxPages = 3) => {
      const tasks: CUTask[] = [];
      for (let page = 0; page < maxPages; page++) {
        const r = await get<{ tasks: CUTask[]; last_page?: boolean }>(`/list/${listId}/task`, { include_closed: true, subtasks: true, page });
        tasks.push(...r.tasks);
        if (r.last_page !== false || r.tasks.length < 100) break;
      }
      return tasks;
    },
    teamTasks,
  };
}

export type ClickUpClient = ReturnType<typeof createClickUpClient>;
