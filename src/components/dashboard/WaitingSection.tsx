"use client";

import { waiting } from "@/data/brief";
import type { WaitState } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Pill, PillRow, Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

const STATE_TONE: Record<WaitState, Tone> = { late: T.red, today: T.amber, blocked: T.amber, ok: T.mint, done: T.mint };

export function WaitingSection() {
  const { nudged, nudge } = useBrief();
  return (
    <Section id="a-waiting">
      <SectionHeader num="02" title="Waiting on others" meta="What you handed off, from ClickUp tasks you assigned and Freshdesk tickets you follow" />
      <PillRow
        pills={[
          { t: "● 1 late", tone: T.red },
          { t: "2 due by Wednesday", tone: T.amber },
          { t: "2 on track", tone: T.mint },
          { t: "✓ 1 delivered", tone: T.grey },
        ]}
      />
      <div className="glass px-5 pt-0.5 pb-1">
        {waiting.map((w, i) => {
          const canNudge = (w.s === "late" || w.s === "blocked") && !nudged[w.id];
          return (
            <div key={w.id} className={`flex flex-col gap-[9px] py-3.5 ${i ? "row-divider" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-[14.5px] leading-[1.4] font-semibold text-pretty text-fg">{w.what}</span>
                <Pill tone={STATE_TONE[w.s]}>{w.label}</Pill>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3.5 gap-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex size-6 flex-none items-center justify-center rounded-full bg-white/8 text-[9.5px] font-bold text-fg-3">
                    {w.who.split(" ").map((x) => x[0]).join("")}
                  </span>
                  <span className="text-[13px] font-semibold text-fg-2">{w.who}</span>
                  <span className="text-[12.5px] text-dim">{w.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11.5px] text-dim">{w.asked}</span>
                  <span className="font-mono text-[11.5px] font-medium text-fg-3">→ {w.due}</span>
                  {canNudge && (
                    <button className="btn-outline px-[13px]! py-1.5! text-[12px]!" onClick={() => nudge(w.id)}>
                      Nudge
                    </button>
                  )}
                  {nudged[w.id] && <span className="text-[12px] font-medium text-mint">Nudged ✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
