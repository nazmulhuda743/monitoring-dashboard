"use client";

import { allDecisions } from "@/lib/derive";
import { Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

export function DecisionsSection() {
  const { needStatus, postDecision } = useBrief();
  const decisions = allDecisions(needStatus, postDecision);
  return (
    <Section id="a-decisions">
      <SectionHeader num="07" title="Decided this week" meta="So you don’t have to remember it. Each decision was shared with the people it affects." />
      <div className="glass px-5 pt-0.5 pb-1">
        {decisions.map((d, i) => (
          <div key={`${d.day}-${d.what}`} className={`flex flex-wrap items-baseline gap-x-4 gap-y-1.5 py-[13px] ${i ? "row-divider" : ""}`}>
            <span className="flex-[0_0_54px] font-mono text-[11.5px] font-medium" style={{ color: d.day === "TODAY" ? "#1FE0A0" : "#8A939D" }}>
              {d.day}
            </span>
            <span className="min-w-0 flex-[1_1_280px] text-[14px] leading-[1.45] font-medium text-fg">{d.what}</span>
            <span className="ml-auto flex items-baseline gap-2.5">
              <span className="text-[12px] text-muted-2">{d.told}</span>
              <span className="src-tag">{d.src}</span>
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
