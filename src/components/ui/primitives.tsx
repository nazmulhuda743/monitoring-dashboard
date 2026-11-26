import type { CSSProperties, ReactNode } from "react";
import { T, type Tone, type ToneName } from "@/lib/tones";

const toneOf = (t: Tone | ToneName): Tone => (typeof t === "string" ? T[t] : t);

/** Rounded status pill, e.g. "● 1 overdue". */
export function Pill({ tone, children, small }: { tone: Tone | ToneName; children: ReactNode; small?: boolean }) {
  const { fg, tint } = toneOf(tone);
  return (
    <span className={small ? "pill-sm" : "pill"} style={{ color: fg, background: tint }}>
      {children}
    </span>
  );
}

export function PillRow({ pills }: { pills: { t: string; tone: Tone | ToneName }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((p) => (
        <Pill key={p.t} tone={p.tone}>
          {p.t}
        </Pill>
      ))}
    </div>
  );
}

export function Eyebrow({ children, color, className = "", style }: { children: ReactNode; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <span className={`eyebrow ${className}`} style={{ ...(color ? { color } : null), ...style }}>
      {children}
    </span>
  );
}

/** Numbered section header: big serif "01", title, subtitle and a mint rule. */
export function SectionHeader({ num, title, meta }: { num: string; title: string; meta: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-4 sm:gap-5">
        <span
          className="flex-none font-serif text-[52px] italic leading-[.78] text-mint sm:text-[66px]"
          style={{ textShadow: "0 0 36px rgba(31,224,160,.45)" }}
        >
          {num}
        </span>
        <div className="flex min-w-0 flex-col gap-[7px]">
          <h2 className="m-0 text-[clamp(24px,2.6vw,30px)] leading-[1.05] font-semibold tracking-[-.035em] text-fg-strong">
            {title}
          </h2>
          <span className="text-[13.5px] leading-[1.45] text-muted-2 text-pretty">{meta}</span>
        </div>
      </div>
      <span className="h-px" style={{ background: "linear-gradient(90deg,rgba(31,224,160,.5),rgba(255,255,255,.07) 28%,transparent)" }} />
    </div>
  );
}

export function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-[84px] flex-col gap-6 lg:scroll-mt-8">
      {children}
    </section>
  );
}

/** Label/value block used inside detail panels ("GOAL", "OWNER", …). */
export function Field({ label, children, gap = 5 }: { label: string; children: ReactNode; gap?: number }) {
  return (
    <div className="flex flex-col" style={{ gap }}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}
