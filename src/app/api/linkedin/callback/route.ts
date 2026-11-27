import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { completeConnect } from "@/server/linkedin";
import { messagePage, redirectUriFor, requireConfig, STATE_COOKIE } from "@/server/linkedin/routes";
import { getStore } from "@/server/store";

/** GET /api/linkedin/callback — LinkedIn sends the admin back here after "Allow". */
export async function GET(req: NextRequest) {
  const cfg = requireConfig();
  const store = getStore();
  if (!cfg || !store) return messagePage("LinkedIn isn't set up yet", "LinkedIn settings or storage are missing on the server.");

  const p = req.nextUrl.searchParams;
  if (p.get("error")) {
    return messagePage("LinkedIn connection cancelled", p.get("error_description") || "No access was granted. You can try again any time.");
  }
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) {
    return messagePage("Link expired", "This sign-in link is no longer valid. Go back to the dashboard and click “connect” again.");
  }

  try {
    await completeConnect(cfg, store, code, redirectUriFor(cfg, req), Date.now());
  } catch (err) {
    console.error("[linkedin] connect failed:", err instanceof Error ? err.message : err);
    return messagePage("Couldn't connect LinkedIn", err instanceof Error ? err.message : "Unknown error.");
  }

  revalidateTag("brief", { expire: 0 }); // show the page data on the next view
  const res = NextResponse.redirect(new URL("/#a-content", req.nextUrl.origin));
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/linkedin" });
  return res;
}
