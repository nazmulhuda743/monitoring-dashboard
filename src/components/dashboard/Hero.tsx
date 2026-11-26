"use client";

import { profile } from "@/data/brief";
import { Eyebrow } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";
import { FocusDial } from "./FocusDial";

function Legend({ color, glow, label, value }: { color: string; glow?: boolean; label: string; value: string }) {
  return (
    <span className="flex items-center gap-[7px]">
      <span className="h-1 w-2.5 rounded-[2px]" style={{ background: color, boxShadow: glow ? `0 0 8px ${color}` : undefined }} />
      {label} <span className="font-mono text-fg">{value}</span>
    </span>
  );
}

export function Hero() {
  const { active, goStart } = useBrief();
  const cta = active.length ? `Start with ${active[0].short}` : "You’re clear. See projects";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4 px-1">
        <Eyebrow color="#8A939D">{profile.dateLabel}</Eyebrow>
        <span className="flex items-center gap-[9px] rounded-full px-3 py-[7px] font-mono text-[11.5px] font-medium text-muted" style={{ border: "1px solid rgba(31,224,160,.22)", background: "rgba(31,224,160,.06)" }}>
          <span className="size-[7px] rounded-full bg-mint" style={{ animation: "bdPulse 2.4s ease-out infinite" }} />
          <span className="text-mint">Live</span>synced {profile.syncedAt}
        </span>
      </header>

      <div
        className="relative grid items-center gap-9 overflow-hidden rounded-[30px] p-[clamp(28px,4.4vw,56px)]"
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))",
          border: "1px solid rgba(255,255,255,.08)",
          background: "linear-gradient(135deg,rgba(26,38,44,.78),rgba(10,15,20,.66) 55%,rgba(14,18,30,.7))",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.07),0 50px 120px -60px rgba(0,0,0,.95)",
          backdropFilter: "blur(26px) saturate(140%)",
          WebkitBackdropFilter: "blur(26px) saturate(140%)",
        }}
      >
        <span className="pointer-events-none absolute -top-60 -right-35 size-155 rounded-full" style={{ background: "radial-gradient(closest-side,rgba(31,224,160,.17),transparent)" }} />
        <span className="absolute top-0 right-[10%] left-[10%] h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)" }} />

        <div className="relative flex min-w-0 flex-col gap-6">
          <h1 className="m-0 text-[clamp(42px,5.6vw,76px)] leading-[.96] font-semibold tracking-[-.05em] text-fg-strong">
            Good morning,
            <br />
            <span className="font-serif text-[1.14em] leading-none font-normal tracking-[-.015em] text-mint italic" style={{ textShadow: "0 0 60px rgba(31,224,160,.35)" }}>
              {profile.firstName}.
            </span>
          </h1>
          <p className="m-0 max-w-[44ch] text-[clamp(16px,1.5vw,19px)] leading-[1.6] text-pretty text-muted">
            Today is about <strong className="font-medium text-fg-strong">one unhappy client and one pricing decision</strong>. Next week&apos;s posts are ready for your OK, and the support team is answering on time.
          </p>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-3.5">
            <a
              role="button"
              href={active.length ? "#a-needs" : "#a-projects"}
              onClick={(e) => {
                e.preventDefault();
                goStart();
              }}
              className="inline-flex cursor-pointer items-center gap-2.5 rounded-full bg-mint px-5 py-[13px] text-[14px] font-semibold text-mint-ink transition-[transform,background] duration-200 hover:-translate-y-px hover:bg-mint-hover hover:text-mint-ink"
              style={{ boxShadow: "0 10px 34px -10px rgba(31,224,160,.75),inset 0 1px 0 rgba(255,255,255,.4)" }}
            >
              {cta}
              <span className="font-mono text-[14px] font-medium">→</span>
            </a>
            <span className="font-mono text-[12px] text-dim">≈ 2 min to read it all</span>
          </div>
        </div>

        <div className="relative flex min-w-0 flex-col items-center gap-[18px]">
          <FocusDial />
          <div className="flex flex-wrap justify-center gap-x-[18px] gap-y-2 text-[12px] text-muted-2">
            <Legend color="#C9D0D6" label="Meetings" value="2h30" />
            <Legend color="#1FE0A0" glow label="Focus" value="2h" />
            <Legend color="#F5B13D" label="Needs prep" value="1" />
          </div>
        </div>
      </div>
    </>
  );
}
