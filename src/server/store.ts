import "server-only";

/**
 * Tiny key-value store for server-side state that must survive deploys and
 * serverless instances (e.g. the LinkedIn OAuth token and its data snapshot).
 *
 * - Production (Vercel): Upstash Redis via its REST API. Connect it in
 *   Vercel → Storage → Upstash (Redis); Vercel then injects either
 *   KV_REST_API_URL + KV_REST_API_TOKEN or UPSTASH_REDIS_REST_URL + _TOKEN.
 * - Local dev / tests: a JSON file (STORE_FILE, default .data/store.json).
 *   Never used on Vercel (its filesystem is read-only/ephemeral).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface Store {
  kind: "redis" | "file";
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

export function getStore(env: Record<string, string | undefined> = process.env): Store | null {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url.replace(/\/$/, ""), token);
  if (env.VERCEL) return null; // no persistent store connected yet
  return fileStore(env.STORE_FILE || ".data/store.json");
}

function redisStore(url: string, token: string): Store {
  async function cmd<T>(...args: (string | number)[]): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
    if (!res.ok || body.error) throw new Error(`Store error ${res.status}: ${body.error ?? "unknown"}`);
    return body.result as T;
  }
  return {
    kind: "redis",
    async get<T>(key: string) {
      const v = await cmd<string | null>("GET", key);
      return v == null ? null : (JSON.parse(v) as T);
    },
    async set(key, value) {
      await cmd("SET", key, JSON.stringify(value));
    },
    async del(key) {
      await cmd("DEL", key);
    },
  };
}

function fileStore(path: string): Store {
  const load = async (): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch {
      return {};
    }
  };
  const save = async (all: Record<string, unknown>) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(all, null, 2));
  };
  return {
    kind: "file",
    async get<T>(key: string) {
      return ((await load())[key] as T) ?? null;
    },
    async set(key, value) {
      const all = await load();
      all[key] = value;
      await save(all);
    },
    async del(key) {
      const all = await load();
      delete all[key];
      await save(all);
    },
  };
}
