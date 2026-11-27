"use client";

import { useState } from "react";
import type { LinkedInRow } from "@/data/types";
import { T } from "@/lib/tones";
import { Eyebrow, Pill, Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

const nf = new Intl.NumberFormat("en-US");
/** 14200 → "14.2k", 9800 → "9.8k", 3000 → "3k" (as in the design). */
const fk = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace(".0", "")}k` : String(v));

const BAR_MAX = 118; // px, tallest week
const LIVE_WEEKS = 4; // highlighted (last 4 weeks)

/** Section 06 — "<page> on LinkedIn" (design v2). */
export function LinkedInSection() {
  const { data } = useBrief();
  const li = data.linkedin;
  const [sort, setSort] = useState<"eng" | "reach">("eng");

  const mx = Math.max(1, ...li.weeks.map((w) => w.v));
  const paceUp = li.pace.last >= li.pace.before;
  const pacePct = li.pace.before ? Math.round(((li.pace.last - li.pace.before) / li.pace.before) * 100) : null;

  const best = Math.max(0, ...li.posts.map((p) => p.rate));
  const worst = Math.min(...li.posts.map((p) => p.rate));
  const rows = [...li.posts].sort((a, b) => (sort === "reach" ? b.impressions - a.impressions : b.rate - a.rate));
  const tone = (r: number) => (r >= li.avgRate ? T.mint : r >= 2 ? T.amber : T.red);
  const tag = (p: LinkedInRow) =>
    li.posts.length < 2 ? null : p.rate === best ? { t: li.bestLabel, tone: T.mint } : p.rate === worst ? { t: "Weakest", tone: T.red } : null;
  const seg = (on: boolean) => ({ background: on ? "#1FE0A0" : "transparent", color: on ? "#04120C" : "#9BA4AE" });

  return (
    <Section id="a-linkedin">
      <SectionHeader num="06" title={`${li.page.label} on LinkedIn`} meta={`Company page analytics · last 30 days vs the 30 before · synced ${li.syncedAt}`} />
      <p className="m-0 max-w-[80ch] text-[14.5px] leading-[1.6] text-pretty text-muted">
        <strong className="font-semibold text-mint">{li.lead}</strong> {li.summary}
      </p>

      {/* KPI cards */}
      {/* Phones: 2 per row; from sm up: the design's auto-fit grid. */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,200px),1fr))]">
        {li.kpis.map((kp) => (
          <div key={kp.k} className="glass flex min-w-0 flex-col gap-3 px-4 py-4 sm:px-5 sm:py-[18px]">
            <Eyebrow>{kp.k}</Eyebrow>
            <span className="font-mono text-[26px] leading-none font-medium tracking-[-.03em] text-fg-strong sm:text-[30px]">{kp.v}</span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <Pill tone={kp.tone}>{kp.d}</Pill>
              <span className="font-mono text-[11.5px] text-dim">{kp.dk}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-stretch gap-3.5">
        {/* New followers per week — basis 486 = design's 440px content-box + 44 padding + 2 border */}
        <div className="glass flex min-w-0 flex-[999_1_486px] flex-col gap-3.5 px-[22px] py-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Eyebrow>New followers per week</Eyebrow>
            <span className="font-mono text-[11.5px] text-dim">
              {li.weeks.length} weeks · <span className="text-fg">{li.page.followers == null ? "—" : nf.format(li.page.followers)}</span> total
            </span>
          </div>
          <div className="flex h-[150px] items-end gap-1.5 border-b border-white/8">
            {li.weeks.map((w, i) => {
              const live = i >= li.weeks.length - LIVE_WEEKS;
              return (
                <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="font-mono text-[10px]" style={{ color: live ? "#C9D0D6" : "#5C6570" }}>
                    {w.v}
                  </span>
                  <div
                    className="w-full rounded-[4px_4px_1px_1px]"
                    style={{ height: Math.round((w.v / mx) * BAR_MAX), background: live ? "#6FA4FA" : "rgba(111,164,250,.32)", boxShadow: live ? "0 0 14px -4px #6FA4FA" : "none" }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {li.weeks.map((w, i) => (
              <span key={i} className="min-w-0 flex-1 text-center font-mono text-[10px] whitespace-nowrap text-dim">
                {w.l}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-muted-2">
            <span className="flex items-center gap-[7px]">
              <span className="h-1 w-2.5 rounded-[2px] bg-blue" style={{ boxShadow: "0 0 8px #6FA4FA" }} />
              Last 4 weeks <span className="font-mono text-fg">{nf.format(li.pace.last)}</span>
            </span>
            <span className="flex items-center gap-[7px]">
              <span className="h-1 w-2.5 rounded-[2px]" style={{ background: "rgba(111,164,250,.32)" }} />4 weeks before <span className="font-mono text-fg">{nf.format(li.pace.before)}</span>
            </span>
            {pacePct !== null && (
              <span className="font-mono text-[12px] font-medium" style={{ color: paceUp ? "#1FE0A0" : "#F26B5E" }}>
                {pacePct >= 0 ? "+" : ""}
                {pacePct}% pace
              </span>
            )}
          </div>
        </div>

        {/* What's working — basis 346 = 300 + 44 + 2 */}
        <div className="glass flex min-w-0 flex-[1_1_346px] flex-col gap-3.5 px-[22px] py-5">
          <Eyebrow>What&apos;s working</Eyebrow>
          {li.works.length === 0 && <span className="text-[13px] leading-[1.55] text-muted">Not enough posts yet to spot patterns.</span>}
          {li.works.map((w) => (
            <div key={w.t} className="row-divider flex flex-col gap-1 pt-3">
              <span className="text-[14px] leading-[1.35] font-semibold text-fg">{w.t}</span>
              <span className="text-[13px] leading-[1.55] text-pretty text-muted">{w.d}</span>
            </div>
          ))}
          {li.next && (
            <div className="mt-auto flex items-baseline gap-2.5 rounded-[14px] px-3.5 py-3" style={{ background: "rgba(76,141,246,.05)", border: "1px solid rgba(76,141,246,.2)" }}>
              <Pill tone={T.blue}>Next week</Pill>
              <span className="text-[13px] leading-[1.55] text-fg-3">{li.next}</span>
            </div>
          )}
        </div>
      </div>

      {/* Which posts people engaged with */}
      <div className="glass px-5 pt-0.5 pb-1">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4 pb-3">
          <Eyebrow>Which posts people engaged with</Eyebrow>
          <div className="flex rounded-full border border-white/10 p-[3px]" style={{ background: "rgba(4,7,10,.5)" }}>
            <button className="rounded-full border-none px-[13px] py-1.5 text-[12px] font-semibold" style={seg(sort === "eng")} onClick={() => setSort("eng")}>
              By engagement
            </button>
            <button className="rounded-full border-none px-[13px] py-1.5 text-[12px] font-semibold" style={seg(sort === "reach")} onClick={() => setSort("reach")}>
              By reach
            </button>
          </div>
        </div>
        {rows.length === 0 && <div className="row-divider py-[18px] text-[14px] text-muted-2">No posts in the last 30 days.</div>}
        {rows.map((p, i) => {
          const t = tone(p.rate);
          const tg = tag(p);
          return (
            <div key={p.id} className="row-divider flex flex-wrap items-center gap-x-[22px] gap-y-2.5 py-3.5">
              <span className="w-[22px] flex-none font-mono text-[12px] font-medium text-dim">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noreferrer" className="text-[14.5px] leading-[1.4] font-semibold text-pretty text-fg! hover:underline">
                    {p.title}
                  </a>
                ) : (
                  <span className="text-[14.5px] leading-[1.4] font-semibold text-pretty text-fg">{p.title}</span>
                )}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <span className="font-mono text-[11.5px] text-muted-2">
                    {p.date} · {p.format}
                  </span>
                  {tg && (
                    <Pill small tone={tg.tone}>
                      {tg.t}
                    </Pill>
                  )}
                </div>
              </div>
              {/* Phones: 4 stats in a grid, engagement bar full width below. */}
              <div className="ml-auto flex items-center gap-5 max-sm:ml-0 max-sm:grid max-sm:w-full max-sm:grid-cols-4 max-sm:gap-x-2 max-sm:gap-y-3">
                {[
                  { v: fk(p.impressions), k: "seen" },
                  { v: String(p.reactions), k: "reactions" },
                  { v: String(p.comments), k: "comments" },
                  { v: String(p.reposts), k: "reposts" },
                ].map((s) => (
                  <div key={s.k} className="flex min-w-11 flex-col items-end gap-1 max-sm:items-start">
                    <span className="font-mono text-[13px] leading-none font-medium text-fg">{s.v}</span>
                    <span className="text-[10.5px] leading-[1.2] text-dim">{s.k}</span>
                  </div>
                ))}
                <div className="flex w-[104px] flex-col gap-[7px] max-sm:col-span-4 max-sm:w-full">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10.5px] text-dim">engagement</span>
                    <span className="font-mono text-[13px] leading-none font-medium" style={{ color: t.fg }}>
                      {p.rate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-[2px] bg-white/6">
                    <div className="h-full rounded-[2px]" style={{ width: `${best ? Math.round((p.rate / best) * 100) : 0}%`, background: t.fg, boxShadow: `0 0 10px -2px ${t.fg}` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
