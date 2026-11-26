import { checks } from "@/data/brief";
import { T } from "@/lib/tones";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/primitives";
import { NextBrief } from "./NextBrief";

export function EverythingElseSection({ showMetrics = true }: { showMetrics?: boolean }) {
  return (
    <Section id="a-else">
      <SectionHeader num="08" title="Everything else" meta="Checked for you overnight" />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))" }}>
        {checks.map((c) => {
          const tone = c.ok ? T.mint : T.amber;
          return (
            <div key={c.source} className="glass flex flex-col gap-[9px] px-4 pt-4 pb-[18px]">
              <div className="flex items-center justify-between">
                <Eyebrow>{c.source}</Eyebrow>
                <span className="flex size-5 items-center justify-center rounded-full text-[11px] font-bold" style={{ color: tone.fg, background: tone.tint }}>
                  {c.ok ? "✓" : "!"}
                </span>
              </div>
              <span className="text-[15px] font-bold">{c.title}</span>
              <span className="text-[13px] leading-[1.55] text-pretty text-muted">{c.verdict}</span>
              {showMetrics && (
                <div className="row-divider mt-auto flex gap-3.5 pt-[11px]">
                  {c.metrics.map((m) => (
                    <div key={m.k} className="flex flex-col gap-1">
                      <span className="font-mono text-[13px] leading-none font-medium text-fg">{m.v}</span>
                      <span className="text-[10.5px] leading-[1.2] text-dim">{m.k}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-14 flex flex-col items-center gap-[18px] px-5 pt-12 pb-2 text-center">
        <span className="size-2 rounded-full bg-mint" style={{ boxShadow: "0 0 0 6px rgba(31,224,160,.12),0 0 30px #1FE0A0" }} />
        <span className="font-serif text-[clamp(30px,4vw,48px)] leading-[1.1] tracking-[-.01em] text-balance text-fg italic">
          That&apos;s everything.
          <br />
          <span className="text-mint">The rest can wait until tomorrow.</span>
        </span>
        <NextBrief />
      </div>
    </Section>
  );
}
