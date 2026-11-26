import { clients, runwayAxis } from "@/data/brief";
import type { ClientHealth } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Eyebrow, Pill, PillRow, Section, SectionHeader } from "@/components/ui/primitives";

const HEALTH: Record<ClientHealth, { label: string; tone: Tone; halo: string }> = {
  risk: { label: "At risk", tone: T.red, halo: "rgba(242,107,94,.16)" },
  watch: { label: "Watch", tone: T.amber, halo: "rgba(245,177,61,.14)" },
  ok: { label: "Healthy", tone: T.mint, halo: "rgba(31,224,160,.14)" },
};
const RUNWAY_DAYS = 60;
const MAX_VALUE_K = 240;
const LABEL_TX = { c: "translateX(-50%)", r: "translateX(calc(-100% + 8px))", l: "translateX(-8px)" };
const LABEL_ALIGN = { c: "center", r: "right", l: "left" } as const;
const LABEL_ITEMS = { c: "center", r: "flex-end", l: "flex-start" } as const;

/** Timeline of renewals over the next 60 days; bubble size = contract value. */
function RenewalRunway() {
  return (
    <div className="glass flex flex-col gap-2 px-6 pt-[22px] pb-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Eyebrow>Renewal runway · next 60 days</Eyebrow>
        <span className="font-mono text-[11.5px] text-dim">bubble size = contract value</span>
      </div>
      {/* Below ~700px the timeline keeps its width and scrolls inside the card. */}
      <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:thin]">
      <div className="flex min-w-[620px] flex-col gap-2">
      <div className="relative mx-2 h-[178px]">
        <div className="absolute top-[88px] right-0 left-0 h-0.5 rounded-[1px]" style={{ background: "linear-gradient(90deg,rgba(242,107,94,.75),rgba(245,177,61,.35) 45%,rgba(255,255,255,.07))" }} />
        <div className="absolute top-[79px] left-0 h-5 w-0.5 rounded-[1px] bg-fg" style={{ boxShadow: "0 0 12px rgba(255,255,255,.7)" }} />
        {clients.map((c) => {
          const h = HEALTH[c.h];
          const size = Math.round(12 + (c.valueK / MAX_VALUE_K) * 20);
          const { top, anchor } = c.runway;
          return (
            <div key={c.name} className="absolute top-0 bottom-0 w-0" style={{ left: `${((c.daysOut / RUNWAY_DAYS) * 100).toFixed(1)}%` }}>
              <div className="absolute left-0 h-[42px] w-px bg-white/16" style={{ top: top ? 40 : 96 }} />
              <div
                className="absolute top-[89px] left-0 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ width: size, height: size, background: h.tone.fg, boxShadow: `0 0 0 5px ${h.halo}, 0 0 28px ${h.tone.fg}99` }}
              />
              <div
                className="absolute left-0 flex flex-col gap-1 whitespace-nowrap"
                style={{ top: top ? 0 : 138, transform: LABEL_TX[anchor], textAlign: LABEL_ALIGN[anchor], alignItems: LABEL_ITEMS[anchor] }}
              >
                <span className="text-[13px] font-semibold text-fg">{c.name}</span>
                <span className="font-mono text-[11px]" style={{ color: c.h === "risk" ? "#F26B5E" : "#8A939D" }}>
                  {c.value} · {c.date}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative mx-2 h-3.5">
        {runwayAxis.map((a) => (
          <span key={a.t} className="absolute top-0 font-mono text-[10.5px] whitespace-nowrap text-dim-2" style={{ left: `${a.left}%`, transform: a.tx }}>
            {a.t}
          </span>
        ))}
      </div>
      </div>
      </div>
    </div>
  );
}

export function ClientsSection() {
  return (
    <Section id="a-clients">
      <SectionHeader num="04" title="Key clients" meta="CDS accounts renewing in the next 60 days, with early warnings from Freshdesk and ClickUp" />
      <PillRow
        pills={[
          { t: "$705k renewing", tone: T.grey },
          { t: "● 1 at risk", tone: T.red },
          { t: "● 2 watch", tone: T.amber },
          { t: "● 2 healthy", tone: T.mint },
        ]}
      />
      <RenewalRunway />
      <div className="glass px-5 pt-0.5 pb-1">
        {clients.map((c, i) => {
          const h = HEALTH[c.h];
          return (
            <div key={c.name} className={`flex flex-col gap-[7px] py-[15px] ${i ? "row-divider" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[15px] leading-[1.3] font-semibold">{c.name}</span>
                  <span className="text-[12.5px] text-dim sm:whitespace-nowrap">
                    {c.sector} · <span className="font-mono text-fg-3">{c.value}</span>/yr · renews {c.date}
                  </span>
                </div>
                <div className="flex flex-none items-center gap-2.5">
                  <span className="font-mono text-[12.5px] font-medium" style={{ color: c.h === "risk" ? "#F26B5E" : "#E8ECEF" }}>
                    {c.daysOut} days
                  </span>
                  <Pill tone={h.tone}>{h.label}</Pill>
                </div>
              </div>
              <span className="text-[13.5px] leading-[1.55] text-pretty text-muted">{c.signal}</span>
              <span className="text-[13px] leading-[1.4] font-medium" style={{ color: h.tone.fg }}>
                → {c.move}
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
