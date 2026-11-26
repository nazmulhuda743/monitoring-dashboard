/** Pure helpers that derive display values from brief state. */
import type { Decision, Need, NeedStatus } from "@/data/types";

/** Decisions made in this session (marked done / approvals), newest first. */
export function todayDecisions(
  needs: Need[],
  needStatus: Record<string, NeedStatus | undefined>,
  postDecision: Record<string, "approved" | "changes" | undefined>,
): Decision[] {
  const out: Decision[] = [];
  // Reverse list order matches the design (last needs first).
  for (const n of [...needs].reverse()) {
    if (needStatus[n.id] !== "done" || n.decision === null) continue;
    const d = n.decision ?? { what: `Done: ${n.title}`, told: "", src: n.source.split(" · ")[0].toUpperCase() };
    out.push({ day: "TODAY", ...d });
  }
  const vals = Object.values(postDecision);
  const approved = vals.filter((v) => v === "approved").length;
  const changes = vals.filter((v) => v === "changes").length;
  if (approved) out.push({ day: "TODAY", what: `Approved ${approved} LinkedIn post${approved > 1 ? "s" : ""} for the content calendar`, told: "Told: Sofía", src: "LINKEDIN" });
  if (changes) out.push({ day: "TODAY", what: `Sent ${changes} post${changes > 1 ? "s" : ""} back for changes`, told: "Told: Sofía", src: "LINKEDIN" });
  return out;
}

export function allDecisions(
  needs: Need[],
  past: Decision[],
  needStatus: Record<string, NeedStatus | undefined>,
  postDecision: Record<string, "approved" | "changes" | undefined>,
) {
  return [...todayDecisions(needs, needStatus, postDecision), ...past];
}

/** Decimal hours → "HH:MM". */
export const fmtHour = (h: number) =>
  `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;

/** Minutes → "1h 23m" or "12 min". */
export const fmtDuration = (m: number) =>
  m >= 60 ? `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, "0")}m` : `${Math.max(1, Math.round(m))} min`;
