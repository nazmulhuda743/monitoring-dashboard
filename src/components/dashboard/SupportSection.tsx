import { supportSummary, supportTeams } from "@/data/brief";
import type { SupportAgent } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Eyebrow, Pill, Section, SectionHeader } from "@/components/ui/primitives";

const COLS = "minmax(110px,1.6fr) 36px 48px 60px 44px 92px";
const DAYS = ["T", "W", "T", "F", "S", "S", "M"];
const AGENT_STATUS: Record<SupportAgent["status"], [string, Tone]> = { ok: ["On time", T.mint], slip: ["Slipping", T.amber], ramp: ["Ramping up", T.blue] };
const slaColor = (v: number) => (v >= 95 ? "#1FE0A0" : v >= 90 ? "#F5B13D" : "#F26B5E");
/** Bar height: 80% → 4px floor, 100% → 56px. */
const barHeight = (v: number) => Math.max(4, Math.round(((v - 80) / 20) * 56));

const NUM = "text-right font-mono text-[12.5px]";

export function SupportSection() {
  return (
    <Section id="a-support">
      <SectionHeader num="06" title="Support team" meta="Freshdesk · last 7 days · is everyone answering on time?" />
      <p className="m-0 max-w-[80ch] text-[14.5px] leading-[1.6] text-pretty text-muted">
        <strong className="font-semibold text-mint">{supportSummary.lead}</strong> {supportSummary.text}
      </p>
      {supportTeams.map((tm) => {
        const note = T[tm.noteTone];
        return (
          <div key={tm.label} className="glass grid gap-x-8 gap-y-6 p-5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))" }}>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1.5">
                  <Eyebrow color="#8A939D">{tm.label}</Eyebrow>
                  <span className="text-[16px] font-bold">{tm.headline}</span>
                </div>
                <Pill tone={tm.tone}>{tm.status}</Pill>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-white/7 bg-white/7">
                {tm.metrics.map((m) => (
                  <div key={m.k} className="flex flex-col gap-2 bg-panel px-3.5 py-3">
                    <Eyebrow>{m.k}</Eyebrow>
                    <span className="font-mono text-[20px] leading-none font-medium" style={{ color: m.tone ? T[m.tone].fg : "#E8ECEF" }}>{m.v}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Eyebrow>Within SLA, by day</Eyebrow>
                  <span className="font-mono text-[10.5px] text-dim">target 95%</span>
                </div>
                <div className="flex h-[52px] items-end gap-2 border-b border-white/8">
                  {tm.trend.map((v, i) => {
                    const fg = v >= 95 ? "#14E39A" : "#F5B13D";
                    return <div key={i} className="flex-1 rounded-[4px_4px_1px_1px]" style={{ height: barHeight(v), background: fg, boxShadow: `0 0 14px -4px ${fg}` }} />;
                  })}
                </div>
                <div className="flex gap-2">
                  {DAYS.map((d, i) => (
                    <span key={i} className="flex-1 text-center font-mono text-[10px] text-dim">{d}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              {/* Phones: one compact card per agent instead of the wide table. */}
              <div className="flex flex-col sm:hidden">
                {tm.agents.map((a) => {
                  const [label, tone] = AGENT_STATUS[a.status];
                  const stats: [string, string, string][] = [
                    ["Open", String(a.open), "#C9D0D6"],
                    ["Solved", String(a.solved), "#C9D0D6"],
                    ["1st reply", a.firstReply, a.firstReplyLate ? "#F5B13D" : "#C9D0D6"],
                    ["SLA", `${a.sla}%`, slaColor(a.sla)],
                  ];
                  return (
                    <div key={a.name} className="flex flex-col gap-2.5 border-b border-white/6 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-[3px]">
                          <span className="text-[13.5px] font-semibold">{a.name}</span>
                          <span className="text-[11.5px] leading-[1.35]" style={{ color: a.subTone ? T[a.subTone].fg : "#6B7480" }}>{a.sub}</span>
                        </div>
                        <Pill tone={tone}>{label}</Pill>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {stats.map(([k, v, c]) => (
                          <div key={k} className="flex flex-col gap-1">
                            <span className="font-mono text-[13px] font-medium" style={{ color: c }}>{v}</span>
                            <span className="text-[10.5px] text-dim">{k}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* sm+: the design's table (scrolls inside the card if ever too narrow). */}
              <div className="hidden overflow-x-auto sm:block">
              <div className="flex min-w-[430px] flex-col">
              <div className="grid gap-2 border-b border-white/8 pb-2.5" style={{ gridTemplateColumns: COLS }}>
                <Eyebrow>Person</Eyebrow>
                {["Open", "Solved", "1st reply", "SLA", "Status"].map((h) => (
                  <Eyebrow key={h} className="text-right">{h}</Eyebrow>
                ))}
              </div>
              {tm.agents.map((a) => {
                const [label, tone] = AGENT_STATUS[a.status];
                return (
                  <div key={a.name} className="grid items-center gap-2 border-b border-white/6 py-[11px]" style={{ gridTemplateColumns: COLS }}>
                    <div className="flex min-w-0 flex-col gap-[3px]">
                      <span className="text-[13.5px] font-semibold">{a.name}</span>
                      <span className="text-[11.5px] leading-[1.35]" style={{ color: a.subTone ? T[a.subTone].fg : "#6B7480" }}>{a.sub}</span>
                    </div>
                    <span className={`${NUM} text-fg-2`}>{a.open}</span>
                    <span className={`${NUM} text-fg-2`}>{a.solved}</span>
                    <span className={NUM} style={{ color: a.firstReplyLate ? "#F5B13D" : "#C9D0D6" }}>{a.firstReply}</span>
                    <span className={`${NUM} font-medium`} style={{ color: slaColor(a.sla) }}>{a.sla}%</span>
                    <span className="flex justify-end">
                      <Pill tone={tone}>{label}</Pill>
                    </span>
                  </div>
                );
              })}
              </div>
              </div>
              <div
                className="mt-3.5 flex items-baseline gap-2.5 rounded-[14px] px-3.5 py-3"
                style={{ background: note.fg === T.mint.fg ? "rgba(31,224,160,.05)" : "rgba(76,141,246,.05)", border: `1px solid ${note.fg === T.mint.fg ? "rgba(31,224,160,.2)" : "rgba(76,141,246,.2)"}` }}
              >
                <Pill tone={note}>{tm.noteTag}</Pill>
                <span className="text-[13px] leading-[1.55] text-fg-3">{tm.note}</span>
              </div>
            </div>
          </div>
        );
      })}
    </Section>
  );
}
