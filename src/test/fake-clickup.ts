/**
 * Fake ClickUp API v2 serving the fixture workspace. Used by tests, and for a
 * local end-to-end demo:
 *
 *   node src/test/fake-clickup.ts            # http://localhost:4010
 *   CLICKUP_API_TOKEN=pk_test CLICKUP_API_URL=http://localhost:4010 npm run dev
 *
 * Only accepts the token "pk_test".
 */
import { createServer, type Server } from "node:http";
import { ALL_TASKS, FOLDERLESS, FOLDERS, isClosedTask, LISTS, ME, SPACES } from "./clickup-fixtures.ts";

export const FAKE_TOKEN = "pk_test";

export function startFakeClickUp(port = 0): Promise<{ url: string; server: Server; calls: string[] }> {
  const calls: string[] = [];
  const server = createServer((req, res) => {
    const u = new URL(req.url ?? "/", "http://x");
    calls.push(u.pathname + u.search);
    const send = (status: number, body: unknown) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.headers.authorization !== FAKE_TOKEN) return send(401, { err: "Token invalid", ECODE: "OAUTH_025" });

    const p = u.pathname;
    const q = u.searchParams;
    const page = Number(q.get("page") ?? 0);
    const paged = <T,>(xs: T[]) => ({ tasks: xs.slice(page * 100, page * 100 + 100), last_page: (page + 1) * 100 >= xs.length });
    let m: RegExpMatchArray | null;

    if (p === "/user") return send(200, { user: ME });
    if (p === "/team") return send(200, { teams: [{ id: "9001", name: "Bionda HQ" }] });
    if ((m = p.match(/^\/team\/9001\/space$/))) return send(200, { spaces: SPACES });
    if ((m = p.match(/^\/space\/([^/]+)\/folder$/))) return send(200, { folders: FOLDERS[m[1]] ?? [] });
    if ((m = p.match(/^\/space\/([^/]+)\/list$/))) return send(200, { lists: FOLDERLESS[m[1]] ?? [] });
    if ((m = p.match(/^\/team\/9001\/task$/))) {
      let xs = ALL_TASKS;
      if (q.get("include_closed") !== "true") xs = xs.filter((t) => !isClosedTask(t));
      const doneGt = q.get("date_done_gt");
      if (doneGt) xs = xs.filter((t) => t.date_done && Number(t.date_done) > Number(doneGt));
      return send(200, paged(xs));
    }
    if ((m = p.match(/^\/list\/([^/]+)\/task$/))) {
      const id = m[1];
      if (!Object.values(LISTS).some((l) => l.id === id)) return send(404, { err: "List not found" });
      return send(200, paged(ALL_TASKS.filter((t) => t.list.id === id)));
    }
    send(404, { err: `No route ${p}` });
  });
  return new Promise((resolve) =>
    server.listen(port, () => {
      const addr = server.address();
      resolve({ url: `http://localhost:${typeof addr === "object" && addr ? addr.port : port}`, server, calls });
    }),
  );
}

// `node src/test/fake-clickup.ts` → run standalone.
if (import.meta.url === `file://${process.argv[1]}`) {
  startFakeClickUp(Number(process.env.PORT) || 4010).then(({ url }) => console.log(`Fake ClickUp on ${url} (token: ${FAKE_TOKEN})`));
}
