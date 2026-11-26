"use client";

import { calendarFooter, schedule } from "@/data/brief";
import { T } from "@/lib/tones";
import { Field, Pill, Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

const CARD_SHADOW = "inset 0 1px 0 rgba(255,255,255,.055),0 30px 70px -40px rgba(0,0,0,.85)";
const FLASH_SHADOW = "0 0 0 2px rgba(31,224,160,.7),0 0 70px -10px rgba(31,224,160,.65)";

function CalendarCard() {
  const { meetingOpen, toggleMeeting } = useBrief();
  return (
    // Basis 358 = design's 320px content-box + 36px padding + 2px border.
    <div className="glass flex min-w-0 flex-[1_1_358px] flex-col px-[18px] pt-[18px] pb-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[15px] font-bold">Today&apos;s calendar</span>
        <span className="font-mono text-[11.5px] text-dim">tap a meeting to prep</span>
      </div>
      {schedule.map((e) => {
        const color = e.kind === "focus" ? "#1FE0A0" : e.kind === "flag" ? "#F5B13D" : undefined;
        const open = !!(e.k && meetingOpen[e.k]);
        return (
          <div key={e.t} className="row-divider">
            <div
              onClick={() => e.k && toggleMeeting(e.k)}
              className="flex gap-3 py-2.5"
              style={{ cursor: e.k ? "pointer" : "default" }}
            >
              <span className="w-10 flex-none font-mono text-[12.5px] leading-normal text-muted-2">{e.t}</span>
              <span className="mt-[7px] size-1.5 flex-none rounded-full" style={{ background: color ?? "#4A535E" }} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] leading-[1.4] font-semibold">{e.title}</span>
                <span className="text-[12px] leading-[1.4]" style={{ color: color ?? "#8A939D" }}>{e.meta}</span>
              </div>
              <span className="flex-none font-mono text-[11px] leading-[1.9] font-medium text-mint">{e.k ? (open ? "close" : "prep") : ""}</span>
            </div>
            {open && e.prep && (
              <div className="inset-panel mb-3 ml-[52px] flex flex-col gap-[11px] px-3.5 py-3">
                <Field label="Goal">
                  <span className="text-[13.5px] leading-[1.45] font-medium text-fg">{e.prep.goal}</span>
                </Field>
                <Field label="With">
                  <span className="text-[13px] leading-[1.45] text-fg-3">{e.prep.with}</span>
                </Field>
                <Field label="Context" gap={7}>
                  {e.prep.ctx.map((c) => (
                    <div key={c.t} className="flex items-baseline gap-2">
                      <span className="src-tag">{c.src}</span>
                      <span className="text-[13px] leading-[1.45] text-fg-3">{c.t}</span>
                    </div>
                  ))}
                </Field>
                <Field label="Last time">
                  <span className="text-[13px] leading-[1.45] text-muted-2">{e.prep.last}</span>
                </Field>
              </div>
            )}
          </div>
        );
      })}
      <span className="row-divider pt-3 text-[12.5px] leading-normal text-dim">{calendarFooter}</span>
    </div>
  );
}

export function NeedsSection() {
  const { data, active, needStatus, setNeed, flash } = useBrief();
  const needs = data.needs;
  const doneN = needs.filter((n) => needStatus[n.id] === "done").length;
  const laterN = needs.filter((n) => needStatus[n.id] === "later").length;
  const meta = doneN || laterN ? `${doneN} done · ${laterN} later · ${active.length} left` : "Ordered by urgency · from Freshdesk, ClickUp, LinkedIn and your calendar";
  const parked = needs.filter((n) => needStatus[n.id]);

  return (
    <Section id="a-needs">
      <SectionHeader num="01" title="What needs you today" meta={meta} />
      <div className="flex flex-wrap items-start gap-3.5">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2.5">
          {active.map((n, i) => {
            const tone = T[n.tone];
            return (
              <article
                key={n.id}
                className="glass flex flex-col gap-2 overflow-hidden px-6 py-[22px] transition-[border-color,box-shadow] duration-300 hover:border-white/14"
                style={{ boxShadow: i === 0 && flash ? FLASH_SHADOW : CARD_SHADOW, transitionDuration: ".3s,.6s" }}
              >
                <span className="absolute top-0 right-6 left-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${tone.fg},transparent)` }} />
                <span className="pointer-events-none absolute -top-[90px] -left-15 h-40 w-65 rounded-full opacity-[.09] blur-[50px]" style={{ background: tone.fg }} />
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <span className="eyebrow whitespace-nowrap" style={{ color: "#8A939D" }}>
                    <span className="text-dim">{String(i + 1).padStart(2, "0")}</span>&nbsp; {n.source}
                  </span>
                  <Pill tone={tone}>● {n.due}</Pill>
                </div>
                <h3 className="m-0 mt-1 text-[20px] leading-[1.3] font-semibold tracking-[-.025em] text-pretty">{n.title}</h3>
                <p className="m-0 max-w-[68ch] text-[14px] leading-[1.6] text-pretty text-muted">{n.why}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {n.url ? (
                    <a className="btn-primary text-mint-ink! hover:text-mint-ink!" href={n.url} target="_blank" rel="noreferrer">
                      {n.cta}
                    </a>
                  ) : (
                    <button className="btn-primary">{n.cta}</button>
                  )}
                  <button className="btn-outline" onClick={() => setNeed(n.id, "done")}>Mark done</button>
                  <button className="btn-text" onClick={() => setNeed(n.id, "later")}>Later today</button>
                </div>
              </article>
            );
          })}
          {active.length === 0 && (
            <div className="flex flex-col gap-1.5 rounded-xl p-[22px]" style={{ background: "rgba(31,224,160,.06)", border: "1px solid rgba(31,224,160,.25)" }}>
              <span className="text-[17px] font-semibold text-mint">Nothing else needs you right now.</span>
              <span className="text-[14px] text-muted">Everything on today&apos;s list is handled or parked for later.</span>
            </div>
          )}
          {parked.length > 0 && (
            <div className="flex flex-col">
              {parked.map((n) => {
                const later = needStatus[n.id] === "later";
                return (
                  <div key={n.id} className="row-divider flex items-center gap-3 px-1 py-2.5">
                    <Pill tone={later ? T.amber : T.mint}>{later ? "Later" : "Done"}</Pill>
                    <span className="min-w-0 flex-1 text-[13.5px] text-muted-2">{n.title}</span>
                    <button className="btn-link" onClick={() => setNeed(n.id, undefined)}>Undo</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <CalendarCard />
      </div>
    </Section>
  );
}
