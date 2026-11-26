/** Pure helpers that derive display values from brief state. */
import { pastDecisions } from "@/data/brief";
import type { Decision, NeedId, NeedStatus } from "@/data/types";

export function todayDecisions(
  needStatus: Partial<Record<NeedId, NeedStatus>>,
  postDecision: Record<string, "approved" | "changes" | undefined>,
): Decision[] {
  const out: Decision[] = [];
  const done = (id: NeedId) => needStatus[id] === "done";
  if (done("pricing")) out.push({ day: "TODAY", what: "Approved seller fee pricing for Seller Fees v2", told: "Told: Lucía, marketplace team", src: "CLICKUP" });
  if (done("linkedin")) out.push({ day: "TODAY", what: "Approved your LinkedIn post on Caribbean data sovereignty", told: "Told: Sofía", src: "LINKEDIN" });
  if (done("telecom")) out.push({ day: "TODAY", what: "Handled the Caribbean Telecom escalation", told: "Told: Ana, Kevin", src: "FRESHDESK" });
  const vals = Object.values(postDecision);
  const approved = vals.filter((v) => v === "approved").length;
  const changes = vals.filter((v) => v === "changes").length;
  if (approved) out.push({ day: "TODAY", what: `Approved ${approved} LinkedIn post${approved > 1 ? "s" : ""} for the content calendar`, told: "Told: Sofía", src: "LINKEDIN" });
  if (changes) out.push({ day: "TODAY", what: `Sent ${changes} post${changes > 1 ? "s" : ""} back for changes`, told: "Told: Sofía", src: "LINKEDIN" });
  return out;
}

export function allDecisions(...args: Parameters<typeof todayDecisions>) {
  return [...todayDecisions(...args), ...pastDecisions];
}

/** Decimal hours → "HH:MM". */
export const fmtHour = (h: number) =>
  `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;

/** Minutes → "1h 23m" or "12 min". */
export const fmtDuration = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m` : `${Math.max(1, Math.round(m))} min`;
