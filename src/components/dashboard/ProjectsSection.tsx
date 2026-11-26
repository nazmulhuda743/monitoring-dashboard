"use client";

import { projectGroups, projects } from "@/data/brief";
import type { ProjectStatus } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Eyebrow, Field, Pill, Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

export const PROJECT_STATUS: Record<ProjectStatus, { label: string; tone: Tone; rank: number }> = {
  risk: { label: "At risk", tone: T.red, rank: 0 },
  you: { label: "Needs you", tone: T.blue, rank: 1 },
  watch: { label: "Watch", tone: T.amber, rank: 2 },
  ok: { label: "On track", tone: T.mint, rank: 3 },
};

export function ProjectsSection() {
  const { projectOpen, toggleProject } = useBrief();
  return (
    <Section id="a-projects">
      <SectionHeader num="03" title="Where every project stands" meta={`${projects.length} projects from ClickUp · tap a row for detail`} />
      <div className="glass px-5 pt-1 pb-2">
        {projectGroups.map((g) => {
          const items = projects.filter((p) => p.co === g.co).sort((a, b) => PROJECT_STATUS[a.s].rank - PROJECT_STATUS[b.s].rank);
          return (
            <div key={g.co} className="flex flex-col">
              <div className="flex items-baseline justify-between pt-4 pb-2">
                <Eyebrow color="#8A939D">{g.label}</Eyebrow>
                <span className="font-mono text-[11px] text-dim">{items.length} projects</span>
              </div>
              {items.map((p) => {
                const st = PROJECT_STATUS[p.s];
                const open = !!projectOpen[p.id];
                return (
                  <div key={p.id} className="row-divider">
                    <div onClick={() => toggleProject(p.id)} className="flex cursor-pointer flex-col gap-2.5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-[3px]">
                          <span className="text-[15px] leading-[1.3] font-semibold">{p.name}</span>
                          <span className="text-[13px] leading-[1.4] text-muted-2">{p.line}</span>
                        </div>
                        <div className="flex flex-none items-center gap-2.5">
                          <Pill tone={st.tone}>{st.label}</Pill>
                          <span className="w-3 text-center font-mono text-[16px] text-dim">{open ? "−" : "+"}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-[3px] bg-white/5">
                        <div className="h-full rounded-[3px]" style={{ width: `${p.pct}%`, background: st.tone.fg, boxShadow: `0 0 14px -2px ${st.tone.fg}` }} />
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-[13px] text-fg-2 sm:whitespace-nowrap">
                          <span className="text-dim">Next&nbsp;</span> {p.next}
                        </span>
                        <span className="font-mono text-[12px] text-muted-2">{p.pct}%</span>
                      </div>
                    </div>
                    {open && (
                      <div
                        className="mb-4 grid gap-x-7 gap-y-5 rounded-[14px] p-4"
                        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", background: "rgba(4,7,10,.5)", border: "1px solid rgba(255,255,255,.06)" }}
                      >
                        <Field label="Latest" gap={6}>
                          <span className="text-[13.5px] leading-[1.6] text-pretty text-fg-3">{p.latest}</span>
                        </Field>
                        <Field label="Open items" gap={6}>
                          {p.items.map((it) => (
                            <span key={it} className="text-[13.5px] leading-normal text-fg-3">– {it}</span>
                          ))}
                        </Field>
                        <Field label="Owner" gap={6}>
                          <span className="text-[13.5px] leading-normal font-medium text-fg">{p.owner}</span>
                          <span className="font-mono text-[11.5px] text-dim">{p.updated}</span>
                        </Field>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
