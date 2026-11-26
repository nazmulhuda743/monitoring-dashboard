"use client";

import { useEffect, useState } from "react";
import { profile, sources, waiting } from "@/data/brief";
import { allDecisions } from "@/lib/derive";
import { Eyebrow } from "@/components/ui/primitives";
import { useBrief, weekPosts } from "./BriefProvider";

const SECTION_IDS = ["a-needs", "a-waiting", "a-projects", "a-clients", "a-content", "a-support", "a-decisions", "a-else"];

/** Scroll-spy: which section is currently in the top 30% of the viewport. */
function useActiveSection() {
  const [cur, setCur] = useState("top");
  useEffect(() => {
    const spy = () => {
      let c = "top";
      SECTION_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.3) c = id;
      });
      if (window.scrollY > 200 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) c = "a-else";
      setCur(c);
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
    return () => window.removeEventListener("scroll", spy);
  }, []);
  return cur;
}

function NavItem({ href, label, count, countColor, on }: { href: string; label: string; count?: string | number; countColor?: string; on: boolean }) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 rounded-[11px] px-3 py-[9px] text-[13.5px] font-medium tracking-[-.005em] transition-[background,color] duration-250 hover:bg-white/5! hover:text-fg!"
      style={{ background: on ? "rgba(31,224,160,.10)" : "transparent", color: on ? "#1FE0A0" : "#A3ACB6" }}
    >
      <span
        className="size-[5px] flex-none rounded-full transition-[background,box-shadow] duration-250"
        style={{ background: on ? "#1FE0A0" : "rgba(255,255,255,.14)", boxShadow: on ? "0 0 10px #1FE0A0" : "none" }}
      />
      <span className="min-w-0 flex-1">{label}</span>
      {count !== undefined && <span className="font-mono text-[11px] font-medium" style={{ color: countColor }}>{count}</span>}
    </a>
  );
}

function Group({ children }: { children: string }) {
  return <Eyebrow className="px-3 pt-[18px] pb-[7px]" color="#545D68">{children}</Eyebrow>;
}

export function Sidebar() {
  const cur = useActiveSection();
  const { active, nudged, needStatus, postDecision, postStatus } = useBrief();
  const waitLate = waiting.filter((w) => w.s === "late" && !nudged[w.id]).length || "";
  const readyWeek = weekPosts.filter((p) => postStatus(p) === "ready").length;
  const decisionCount = allDecisions(needStatus, postDecision).length;

  return (
    <>
    {/* Spacer keeps the main column where the in-flow sidebar used to be. */}
    <div aria-hidden className="w-[236px] flex-none" />
    {/* Fixed (not sticky) so it never moves: immune to overscroll bounce and
        ancestor overflow/flex quirks. */}
    <aside className="fixed top-0 left-0 z-10 box-border flex h-dvh w-[236px] py-4 pl-4">
      <div
        className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto rounded-3xl px-2.5 pt-[18px] pb-4 [scrollbar-width:none]"
        style={{
          background: "linear-gradient(180deg,rgba(20,28,35,.72),rgba(8,12,16,.66))",
          border: "1px solid rgba(255,255,255,.07)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.06),0 40px 80px -40px rgba(0,0,0,.9)",
          backdropFilter: "blur(22px) saturate(140%)",
          WebkitBackdropFilter: "blur(22px) saturate(140%)",
        }}
      >
        <div className="flex items-center gap-[11px] px-2 pt-0.5 pb-4">
          <div
            className="box-border size-[38px] flex-none rounded-full p-[1.5px]"
            style={{ background: "conic-gradient(from 200deg,#1FE0A0,#6FA4FA,#C4A1FF,#1FE0A0)", boxShadow: "0 0 26px rgba(31,224,160,.28)" }}
          >
            <div className="flex size-full items-center justify-center rounded-full bg-ink-2 text-[13px] font-semibold tracking-[-.02em]">
              {profile.initials}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <span className="text-[14px] leading-[1.2] font-semibold tracking-[-.01em]">{profile.name}</span>
            <span className="text-[12px] leading-[1.2] text-[#7E8792]">{profile.role}</span>
          </div>
        </div>
        <span className="mx-2 mb-2.5 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent)" }} />

        <NavItem href="#top" label="Morning brief" on={cur === "top"} />
        <Group>Today</Group>
        <NavItem href="#a-needs" label="Needs you" count={active.length} countColor="#F5B13D" on={cur === "a-needs"} />
        <NavItem href="#a-waiting" label="Waiting on others" count={waitLate} countColor="#F26B5E" on={cur === "a-waiting"} />
        <Group>Progress</Group>
        <NavItem href="#a-projects" label="Projects" count={8} countColor="#6B7480" on={cur === "a-projects"} />
        <NavItem href="#a-clients" label="Key clients" count={5} countColor="#6B7480" on={cur === "a-clients"} />
        <NavItem href="#a-content" label="Content to approve" count={readyWeek} countColor="#6FA4FA" on={cur === "a-content"} />
        <NavItem href="#a-support" label="Support team" count="96%" countColor="#1FE0A0" on={cur === "a-support"} />
        <Group>Peace of mind</Group>
        <NavItem href="#a-decisions" label="Decided this week" count={decisionCount} countColor="#6B7480" on={cur === "a-decisions"} />
        <NavItem href="#a-else" label="Everything else" count="✓" countColor="#1FE0A0" on={cur === "a-else"} />

        <div className="min-h-5 flex-1" />
        <div className="-mx-0.5 flex flex-col gap-[9px] rounded-[14px] px-3 pt-3.5 pb-0.5" style={{ background: "rgba(4,7,10,.35)", border: "1px solid rgba(255,255,255,.05)" }}>
          <Eyebrow color="#545D68">Sources · live</Eyebrow>
          {sources.map((s) => (
            <div key={s.name} className="flex items-center gap-2 text-[12.5px] font-medium text-muted">
              <span className="size-1.5 rounded-full bg-mint" style={{ boxShadow: "0 0 8px #1FE0A0" }} />
              <span className="flex-1">{s.name}</span>
              <span className="font-mono text-[11px] text-dim-2">{s.t}</span>
            </div>
          ))}
          <span className="h-1" />
        </div>
      </div>
    </aside>
    </>
  );
}
