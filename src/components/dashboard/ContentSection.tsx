"use client";

import type { CSSProperties } from "react";
import { channels, posts } from "@/data/brief";
import type { Post, PostStatus } from "@/data/types";
import { T, type Tone } from "@/lib/tones";
import { Eyebrow, Pill, PillRow, Section, SectionHeader } from "@/components/ui/primitives";
import { useBrief, weekPosts } from "./BriefProvider";

const STATUS: Record<PostStatus, [string, Tone]> = {
  ready: ["Needs your OK", T.blue],
  approved: ["✓ Approved", T.mint],
  changes: ["Changes asked", T.amber],
  draft: ["Draft", T.grey],
  gap: ["Empty slot", T.red],
};

const CHIP: Record<PostStatus, { bg: string; border: string; bs: string; fg: string }> = {
  approved: { bg: "rgba(31,224,160,.08)", border: "rgba(31,224,160,.3)", bs: "solid", fg: "#C9D0D6" },
  ready: { bg: "rgba(76,141,246,.13)", border: "rgba(111,164,250,.55)", bs: "solid", fg: "#E8ECEF" },
  changes: { bg: "rgba(245,177,61,.10)", border: "rgba(245,177,61,.45)", bs: "solid", fg: "#E8ECEF" },
  draft: { bg: "transparent", border: "rgba(255,255,255,.16)", bs: "dashed", fg: "#8A939D" },
  gap: { bg: "transparent", border: "rgba(242,107,94,.6)", bs: "dashed", fg: "#F26B5E" },
};

/** Day index in the month grid: 0 = Mon 30 Nov, 1..31 = December. */
const dayIdx = (p: Post) => (p.m === 11 ? 0 : p.d);

function PostRow({ p }: { p: Post }) {
  const { postStatus, postOpen, setPost, togglePost } = useBrief();
  const s = postStatus(p);
  const ch = channels[p.ch];
  const [statusLabel, sTone] = STATUS[s];
  const decided = s !== p.base;
  const showNote = !decided && (s === "draft" || s === "approved");
  const open = !!postOpen[p.id] && !!p.body;
  const sub = `by ${p.by}${p.note && s !== "draft" ? ` · ${p.note}` : ""}`;

  return (
    <div className="row-divider">
      <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2.5 py-3.5">
        <div className="flex w-[38px] flex-none flex-col gap-[5px]">
          <span className="font-mono text-[10px] leading-none font-medium text-dim">{p.dow}</span>
          <span className="font-mono text-[19px] leading-none font-medium text-fg">{p.d}</span>
        </div>
        <div onClick={() => togglePost(p.id)} className="flex min-w-0 flex-[1_1_260px] cursor-pointer flex-col gap-[7px]">
          <span className="text-[14.5px] leading-[1.4] font-semibold text-pretty text-fg">{p.title}</span>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="font-mono text-[11.5px] text-muted-2">{p.time}</span>
            <Pill small tone={{ fg: ch.fg, tint: ch.tint }}>{ch.label}</Pill>
            <Pill small tone={sTone}>{statusLabel}</Pill>
            <span className="text-[12px] text-dim">{sub}</span>
            {p.body && <span className="text-[12px] font-medium text-mint">{postOpen[p.id] ? "Hide preview" : "Preview"}</span>}
          </div>
        </div>
        <div className="ml-auto flex flex-[0_1_auto] flex-wrap items-center justify-end gap-1.5">
          {s === "ready" && (
            <>
              <button className="btn-primary" onClick={() => setPost(p.id, "approved")}>Approve</button>
              <button className="btn-neutral" onClick={() => setPost(p.id, "changes")}>Ask for changes</button>
            </>
          )}
          {decided && <button className="btn-link" onClick={() => setPost(p.id, undefined)}>Undo</button>}
          {showNote && <span className="text-[12px] text-dim">{s === "draft" ? p.note || "Not ready yet" : "Approved earlier"}</span>}
        </div>
      </div>
      {open && (
        <div className="inset-panel mb-4 ml-[clamp(0px,calc(100%-640px),56px)] flex max-w-[678px] flex-col gap-3 px-[18px] py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full text-[12px] font-bold" style={{ color: ch.fg, background: ch.tint }}>
              {ch.initials}
            </span>
            <div className="flex flex-col gap-[3px]">
              <span className="text-[13.5px] font-semibold text-fg">{ch.account}</span>
              <span className="font-mono text-[11px] text-dim">
                LinkedIn · {p.dow} {p.d} {p.m === 11 ? "Nov" : "Dec"}, {p.time}
              </span>
            </div>
          </div>
          <p className="m-0 text-[14px] leading-[1.65] text-pretty text-fg-2">{p.body}</p>
        </div>
      )}
    </div>
  );
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function MonthView() {
  const { postStatus, postDecision } = useBrief();
  const cnt = (arr: Post[], s: PostStatus) => arr.filter((p) => postStatus(p) === s).length;

  const coverage = (["you", "cds", "ymi"] as const).map((k) => {
    const ps = posts.filter((p) => p.ch === k);
    const gaps = cnt(ps, "gap");
    const segs = (
      [
        ["approved", "#1FE0A0", "none"],
        ["ready", "#4C8DF6", "none"],
        ["changes", "#F5B13D", "none"],
        ["draft", "rgba(255,255,255,.16)", "none"],
        ["gap", "transparent", "1px dashed #F26B5E"],
      ] as const
    )
      .map(([s, bg, border]) => ({ s, n: cnt(ps, s), bg, border }))
      .filter((x) => x.n);
    return { k, name: channels[k].name, fg: channels[k].fg, segs, label: `${ps.length - gaps}/${ps.length} slots filled${gaps ? ` · ${gaps} empty` : ""}`, labelFg: gaps ? "#F26B5E" : "#8A939D" };
  });

  const monthReady = posts.filter((p) => p.base !== "gap" && dayIdx(p) > 6 && (postStatus(p) === "ready" || postDecision[p.id]));

  return (
    <>
      <div className="glass flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2.5">
          <Eyebrow>Coverage by channel</Eyebrow>
          {coverage.map((cv) => (
            <div
              key={cv.k}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3.5 gap-y-2 sm:grid-cols-[minmax(110px,170px)_minmax(80px,1fr)_minmax(140px,200px)] sm:gap-3.5"
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold">
                <span className="size-2 rounded-full" style={{ background: cv.fg }} />
                {cv.name}
              </span>
              <div className="order-last col-span-2 flex h-1.5 gap-[3px] sm:order-none sm:col-span-1">
                {cv.segs.map((sg) => (
                  <span key={sg.s} className="box-border rounded-[2px]" style={{ flex: sg.n, background: sg.bg, border: sg.border }} />
                ))}
              </div>
              <span className="text-right font-mono text-[11.5px]" style={{ color: cv.labelFg }}>{cv.label}</span>
            </div>
          ))}
        </div>
        {/* Month grid keeps readable cells; on phones it scrolls sideways in the card. */}
        <div className="-mx-5 overflow-x-auto px-5">
        <div className="flex min-w-[640px] flex-col gap-1.5">
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d) => (
              <Eyebrow key={d} className="px-1">{d}</Eyebrow>
            ))}
          </div>
          {[0, 1, 2, 3, 4].map((w) => (
            <div key={w} className="grid grid-cols-7 gap-1.5">
              {DOW.map((_, i) => {
                const di = w * 7 + i;
                const out = di === 0 || di > 31;
                return (
                  <div
                    key={i}
                    className="box-border flex min-h-20 min-w-0 flex-col gap-1 rounded-lg border border-white/5 p-[7px]"
                    style={{ background: i >= 5 ? "#0B0F15" : "#0D1218" }}
                  >
                    <span className="font-mono text-[10.5px] font-medium" style={{ color: out ? "#4A535E" : "#8A939D" }}>
                      {di === 0 ? "30" : di > 31 ? di - 31 : di}
                    </span>
                    {posts
                      .filter((p) => dayIdx(p) === di)
                      .map((p) => {
                        const c = CHIP[postStatus(p)];
                        const ch = channels[p.ch];
                        return (
                          <div
                            key={p.id}
                            className="box-border overflow-hidden rounded px-[5px] py-[3px] text-[10.5px] leading-[1.3] font-medium text-ellipsis whitespace-nowrap"
                            style={{ color: c.fg, background: c.bg, border: `1px ${c.bs} ${c.border}` }}
                          >
                            <span className="font-mono text-[9px] font-medium" style={{ color: ch.fg }}>{ch.short}</span> {p.title}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex flex-wrap gap-4 pt-2 text-[11.5px] text-muted-2">
            <Legend style={{ background: "rgba(31,224,160,.15)", border: "1px solid rgba(31,224,160,.4)" }}>Approved</Legend>
            <Legend style={{ background: "rgba(76,141,246,.15)", border: "1px solid rgba(111,164,250,.6)" }}>Needs your OK</Legend>
            <Legend style={{ border: "1px dashed rgba(255,255,255,.3)" }}>Draft</Legend>
            <Legend style={{ border: "1px dashed rgba(242,107,94,.7)" }}>Empty slot</Legend>
          </div>
        </div>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="text-[14.5px] font-bold">Waiting for your OK in December</span>
        <div className="glass px-5 pt-0.5 pb-1">
          {monthReady.map((p) => (
            <PostRow key={p.id} p={p} />
          ))}
          {monthReady.length === 0 && <div className="py-[18px] text-[14px] font-medium text-mint">Everything ready for December is approved.</div>}
        </div>
      </div>
    </>
  );
}

function Legend({ style, children }: { style: CSSProperties; children: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="box-content size-2.5 rounded-[3px]" style={style} />
      {children}
    </span>
  );
}

export function ContentSection() {
  const { range, setRange, postStatus, approveAll } = useBrief();
  const inRange = range === "week" ? weekPosts : posts;
  const cnt = (s: PostStatus) => inRange.filter((p) => postStatus(p) === s).length;
  const ready = inRange.filter((p) => postStatus(p) === "ready");

  const pills: { t: string; tone: Tone }[] = [
    { t: `● ${ready.length} need your OK`, tone: T.blue },
    { t: `✓ ${cnt("approved")} approved`, tone: T.mint },
  ];
  if (cnt("changes")) pills.push({ t: `${cnt("changes")} sent back`, tone: T.amber });
  if (cnt("draft")) pills.push({ t: `${cnt("draft")} still in draft`, tone: T.grey });
  if (cnt("gap")) pills.push({ t: `${cnt("gap")} empty YamaMi slots`, tone: T.red });

  const seg = (on: boolean) => ({ background: on ? "#1FE0A0" : "transparent", color: on ? "#04120C" : "#9BA4AE" });

  return (
    <Section id="a-content">
      <SectionHeader num="05" title="Content to approve" meta={`LinkedIn · you, CDS and YamaMi · ${range === "week" ? "Mon 30 Nov – Sun 6 Dec" : "December 2026"}`} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillRow pills={pills} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-white/10 p-[3px]" style={{ background: "rgba(4,7,10,.5)" }}>
            <button className="rounded-full border-none px-[13px] py-1.5 text-[12px] font-semibold" style={seg(range === "week")} onClick={() => setRange("week")}>
              Next week
            </button>
            <button className="rounded-full border-none px-[13px] py-1.5 text-[12px] font-semibold" style={seg(range === "month")} onClick={() => setRange("month")}>
              December
            </button>
          </div>
          {ready.length > 0 && (
            <button className="btn-outline" onClick={() => approveAll(ready.map((p) => p.id))}>
              Approve all {ready.length} ready
            </button>
          )}
        </div>
      </div>
      {range === "week" ? (
        <div className="glass px-5 pt-0.5 pb-1">
          {weekPosts.map((p) => (
            <PostRow key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <MonthView />
      )}
    </Section>
  );
}
