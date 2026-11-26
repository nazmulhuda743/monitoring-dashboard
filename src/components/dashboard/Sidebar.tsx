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

const PANEL_STYLE = {
  background: "linear-gradient(180deg,rgba(20,28,35,.72),rgba(8,12,16,.66))",
  border: "1px solid rgba(255,255,255,.07)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06),0 40px 80px -40px rgba(0,0,0,.9)",
  backdropFilter: "blur(22px) saturate(140%)",
  WebkitBackdropFilter: "blur(22px) saturate(140%)",
} as const;

function Avatar({ size = 38 }: { size?: number }) {
  return (
    <div
      className="box-border flex-none rounded-full p-[1.5px]"
      style={{ width: size, height: size, background: "conic-gradient(from 200deg,#1FE0A0,#6FA4FA,#C4A1FF,#1FE0A0)", boxShadow: "0 0 26px rgba(31,224,160,.28)" }}
    >
      <div className="flex size-full items-center justify-center rounded-full bg-ink-2 font-semibold tracking-[-.02em]" style={{ fontSize: size * 0.34 }}>
        {profile.initials}
      </div>
    </div>
  );
}

/** The nav card itself — shared by the desktop sidebar and the mobile drawer. */
function NavPanel({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  const cur = useActiveSection();
  const { active, nudged, needStatus, postDecision, postStatus } = useBrief();
  const waitLate = waiting.filter((w) => w.s === "late" && !nudged[w.id]).length || "";
  const readyWeek = weekPosts.filter((p) => postStatus(p) === "ready").length;
  const decisionCount = allDecisions(needStatus, postDecision).length;

  return (
    <nav
      onClick={(e) => {
        const link = (e.target as HTMLElement).closest("a");
        if (!onNavigate || !link) return;
        // Drawer: close it (which unlocks page scroll) *then* scroll to the section.
        e.preventDefault();
        const id = link.getAttribute("href")?.slice(1);
        onNavigate();
        requestAnimationFrame(() => {
          if (id === "top") window.scrollTo({ top: 0, behavior: "smooth" });
          else document.getElementById(id ?? "")?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }}
      className={`flex min-w-0 flex-1 flex-col gap-0.5 overflow-y-auto rounded-3xl px-2.5 pt-[18px] pb-4 [scrollbar-width:none] ${className}`}
      style={PANEL_STYLE}
    >
      <div className="flex items-center gap-[11px] px-2 pt-0.5 pb-4">
        <Avatar />
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
    </nav>
  );
}

/** Below `lg`: fixed top bar with a menu button that opens the nav as a drawer. */
function MobileBar() {
  const [open, setOpen] = useState(false);
  const { active } = useBrief();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <header
        className="fixed inset-x-0 top-0 z-30 flex h-[60px] items-center gap-3 border-b border-white/7 px-4"
        style={{ background: "rgba(8,12,16,.72)", backdropFilter: "blur(22px) saturate(140%)", WebkitBackdropFilter: "blur(22px) saturate(140%)" }}
      >
        <button
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="-ml-1.5 flex size-10 flex-none items-center justify-center rounded-xl text-fg hover:bg-white/5"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 6h14M3 10h14M3 14h9" />
          </svg>
        </button>
        <Avatar size={32} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[14px] leading-[1.2] font-semibold tracking-[-.01em]">{profile.name}</span>
          <span className="truncate text-[11.5px] leading-[1.2] text-[#7E8792]">{profile.role}</span>
        </div>
        <a href="#a-needs" className="flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1.5 font-mono text-[11px] font-medium text-amber!" style={{ background: "rgba(245,177,61,.12)" }}>
          {active.length} need you
        </a>
      </header>

      <div className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} aria-hidden={!open} inert={!open}>
        <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
        <div
          className={`absolute top-0 left-0 flex h-dvh w-[min(86vw,300px)] p-3 transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Sections"
        >
          <NavPanel
            onNavigate={() => {
              document.body.style.overflow = ""; // unlock now so the smooth scroll isn't cancelled
              setOpen(false);
            }}
          />
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 flex size-8 items-center justify-center rounded-full bg-white/8 text-fg-3 hover:text-fg"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l8 8M11 3l-8 8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop: in-flow spacer + fixed sidebar (fixed, not sticky, so it never
          moves — immune to overscroll bounce and ancestor overflow quirks). */}
      <div aria-hidden className="hidden w-[236px] flex-none lg:block" />
      <aside className="fixed top-0 left-0 z-10 box-border hidden h-dvh w-[236px] py-4 pl-4 lg:flex">
        <NavPanel />
      </aside>
      <MobileBar />
    </>
  );
}
