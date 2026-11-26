"use client";

import type { ReactNode } from "react";
import { pulse } from "@/data/brief";
import type { ProjectStatus } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Eyebrow, PillRow } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

type Seg = { bg: string; glow: string };

const GLOW = {
  red: "0 0 12px rgba(242,107,94,.6)",
  blue: "0 0 12px rgba(111,164,250,.5)",
  mint: "0 0 12px rgba(31,224,160,.55)",
};

function SummaryCard({
  href,
  label,
  value,
  color,
  shadow,
  hoverBorder,
  segs,
  pills,
}: {
  href: string;
  label: string;
  value: ReactNode;
  color: string;
  shadow: string;
  hoverBorder: string;
  segs: Seg[];
  pills: { t: string; tone: Tone }[];
}) {
  return (
    <a
      href={href}
      className="glass flex flex-col gap-4 overflow-hidden px-6 py-[22px] text-fg! transition-[transform,border-color] duration-300 hover:-translate-y-[3px] hover:border-(--hb)"
      style={{ ["--hb" as string]: hoverBorder }}
    >
      <span className="pointer-events-none absolute -top-20 -right-15 h-45 w-55 rounded-full opacity-[.12] blur-[50px]" style={{ background: color }} />
      <div className="relative flex items-center justify-between">
        <Eyebrow color="#8A939D">{label}</Eyebrow>
        <span className="font-mono text-[14px] text-dim-2">↗</span>
      </div>
      <span className="relative font-mono text-[clamp(30px,3.4vw,42px)] leading-none font-medium tracking-[-.04em] whitespace-nowrap" style={{ color, textShadow: shadow }}>
        {value}
      </span>
      <div className="relative flex gap-[5px]">
        {segs.map((s, i) => (
          <span key={i} className="h-1.5 flex-1 rounded-[3px] transition-[background] duration-400" style={{ background: s.bg, boxShadow: s.glow }} />
        ))}
      </div>
      <div className="relative">
        <PillRow pills={pills} />
      </div>
    </a>
  );
}

const seg = (bg: string, glow = "none"): Seg => ({ bg, glow });

const PROJECT_LOOK: Record<ProjectStatus, { color: string; glow: string; shadow: string; hover: string; tone: Tone; headline: (n: number) => string; pill: (n: number) => string }> = {
  risk: { color: "#F26B5E", glow: GLOW.red, shadow: "0 0 34px rgba(242,107,94,.4)", hover: "rgba(242,107,94,.4)", tone: T.red, headline: (n) => `${n} at risk`, pill: (n) => `${n} at risk` },
  you: { color: "#6FA4FA", glow: GLOW.blue, shadow: "0 0 34px rgba(111,164,250,.4)", hover: "rgba(111,164,250,.4)", tone: T.blue, headline: (n) => `${n} need${n === 1 ? "s" : ""} you`, pill: (n) => `${n} need${n === 1 ? "s" : ""} you` },
  watch: { color: "#F5B13D", glow: "none", shadow: "0 0 34px rgba(245,177,61,.4)", hover: "rgba(245,177,61,.4)", tone: T.amber, headline: (n) => `${n} to watch`, pill: (n) => `${n} watch` },
  ok: { color: "#1FE0A0", glow: GLOW.mint, shadow: "0 0 34px rgba(31,224,160,.45)", hover: "rgba(31,224,160,.4)", tone: T.mint, headline: () => "All on track", pill: (n) => `${n} on track` },
};
const ORDER: ProjectStatus[] = ["risk", "you", "watch", "ok"];

/** "1 at risk" headline, one bar per project (worst first) and pills for the rest. */
function projectSummary(statuses: ProjectStatus[]) {
  const counts = Object.fromEntries(ORDER.map((s) => [s, statuses.filter((x) => x === s).length])) as Record<ProjectStatus, number>;
  const top = ORDER.find((s) => counts[s]) ?? "ok";
  const look = PROJECT_LOOK[top];
  return {
    value: statuses.length ? look.headline(counts[top]) : "No projects",
    color: look.color,
    shadow: look.shadow,
    hover: look.hover,
    segs: ORDER.flatMap((s) => Array.from({ length: counts[s] }, () => seg(PROJECT_LOOK[s].color, PROJECT_LOOK[s].glow))),
    pills: ORDER.filter((s) => s !== top && counts[s]).map((s) => ({ t: PROJECT_LOOK[s].pill(counts[s]), tone: PROJECT_LOOK[s].tone })),
  };
}

export function SummaryCards() {
  const { data, active, needStatus } = useBrief();
  const needs = data.needs;
  const k = active.length;
  const doneN = needs.filter((n) => needStatus[n.id] === "done").length;
  const laterN = needs.filter((n) => needStatus[n.id] === "later").length;

  const needSegs = needs.map((n) => {
    const st = needStatus[n.id];
    if (st === "done") return seg("#1FE0A0", "0 0 12px rgba(31,224,160,.6)");
    if (st === "later") return seg("rgba(245,177,61,.25)");
    return seg(n.color, `0 0 12px ${n.color}66`);
  });
  const needPills: { t: string; tone: Tone }[] = [];
  const overdue = active.filter((n) => n.overdue).length;
  if (overdue) needPills.push({ t: `● ${overdue} overdue`, tone: T.red });
  const dueToday = active.length - overdue;
  if (dueToday) needPills.push({ t: `${dueToday} due today`, tone: T.grey });
  if (doneN) needPills.push({ t: `✓ ${doneN} done`, tone: T.mint });
  if (!needPills.length) needPills.push({ t: `${laterN} later today`, tone: T.amber });

  const proj = projectSummary(data.projectGroups.flatMap((g) => g.items.map((p) => p.s)));

  return (
    <>
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))" }}>
        <SummaryCard
          href="#a-needs"
          label="Needs me today"
          value={k === 0 ? "Nothing" : k === 1 ? "1 thing" : `${k} things`}
          color="#F5B13D"
          shadow="0 0 34px rgba(245,177,61,.4)"
          hoverBorder="rgba(245,177,61,.4)"
          segs={needSegs}
          pills={needPills}
        />
        <SummaryCard
          href="#a-projects"
          label="Projects"
          value={proj.value}
          color={proj.color}
          shadow={proj.shadow}
          hoverBorder={proj.hover}
          segs={proj.segs}
          pills={proj.pills}
        />
        <SummaryCard
          href="#a-else"
          label="Everything else"
          value="All clear"
          color="#1FE0A0"
          shadow="0 0 34px rgba(31,224,160,.45)"
          hoverBorder="rgba(31,224,160,.4)"
          segs={[...Array(4).fill(seg("#1FE0A0", GLOW.mint)), seg("#F5B13D")]}
          pills={[
            { t: "4 healthy", tone: T.mint },
            { t: "1 light note", tone: T.amber },
          ]}
        />
      </div>

      <div
        className="flex flex-wrap items-baseline gap-x-[30px] gap-y-2.5 rounded-[18px] px-[22px] py-[15px]"
        style={{ background: "rgba(8,12,16,.55)", border: "1px solid rgba(255,255,255,.06)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}
      >
        <Eyebrow color="#8A939D">Business pulse</Eyebrow>
        {pulse.map((p) => (
          <span key={p.co} className="flex-[1_1_300px] text-[13px] leading-normal text-muted-2">
            <span className="font-semibold text-fg">{p.co}</span>&nbsp; <span className="font-mono text-[12.5px] font-medium" style={{ color: T[p.tone].fg }}>{p.v}</span>&nbsp; {p.text}
          </span>
        ))}
      </div>
    </>
  );
}
