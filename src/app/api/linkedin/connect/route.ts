import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/server/linkedin/oauth";
import { messagePage, redirectUriFor, requireConfig, STATE_COOKIE } from "@/server/linkedin/routes";
import { getStore } from "@/server/store";

/** GET /api/linkedin/connect — start the one-time "Allow LinkedIn" flow. */
export async function GET(req: NextRequest) {
  const cfg = requireConfig();
  if (!cfg) return messagePage("LinkedIn isn't set up yet", "Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in Vercel → Settings → Environment Variables, redeploy, then try again.");
  if (!getStore()) return messagePage("Storage needed first", "Connect Upstash Redis in Vercel → Storage (free tier) and redeploy. The dashboard needs it to remember the LinkedIn login.");

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authorizeUrl(cfg, redirectUriFor(cfg, req), state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/linkedin", maxAge: 600 });
  return res;
}
