"use client";

import type { LinkedInSummary } from "@/data/types";
import { Eyebrow } from "@/components/ui/primitives";

const nf = new Intl.NumberFormat("en-US");
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

function Stat({ v, k, strong }: { v: string; k: string; strong?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 sm:min-w-[52px] sm:items-end">
      <span className={`font-mono text-[13px] leading-none font-medium ${strong ? "text-fg" : "text-fg-2"}`}>{v}</span>
      <span className="text-[10px] leading-[1.2] text-dim sm:text-[10.5px]">{k}</span>
    </div>
  );
}

/** Section 05 add-on: recent posts on the company page with their numbers. */
export function LinkedInPosts({ li }: { li: LinkedInSummary }) {
  const { page, posts, week } = li;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-[14.5px] font-bold">
          Published on{" "}
          <a href={page.url} target="_blank" rel="noreferrer" className="text-fg! hover:underline">
            {page.name}
          </a>
        </span>
        <span className="font-mono text-[11.5px] text-dim">
          last 7 days · {week.posts} post{week.posts === 1 ? "" : "s"} · {nf.format(week.impressions)} impressions · {pct(week.engagement)} engagement
          {page.followers != null && <> · {nf.format(page.followers)} followers</>}
        </span>
      </div>
      <div className="glass px-5 pt-0.5 pb-1">
        {posts.length === 0 && <div className="py-[18px] text-[14px] text-muted-2">No posts on the page yet.</div>}
        {posts.map((p, i) => (
          <div key={p.id} className={`flex flex-wrap items-center gap-x-[18px] gap-y-2.5 py-3.5 ${i ? "row-divider" : ""}`}>
            <div className="flex w-[38px] flex-none flex-col gap-[5px]">
              <span className="font-mono text-[10px] leading-none font-medium text-dim">{p.dow}</span>
              <span className="font-mono text-[19px] leading-none font-medium text-fg">{p.day}</span>
            </div>
            <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[7px]">
              <span className="line-clamp-2 text-[14px] leading-[1.45] text-pretty text-fg">{p.text || "(post without text)"}</span>
              <a href={p.url} target="_blank" rel="noreferrer" className="w-fit text-[12px] font-medium">
                View on LinkedIn ↗
              </a>
            </div>
            {/* Phones: 5 equal columns across the card; wider screens: right-aligned row. */}
            <div className="grid w-full grid-cols-5 gap-1 sm:ml-auto sm:flex sm:w-auto sm:flex-none sm:gap-4">
              <Stat v={compact.format(p.impressions)} k="impressions" strong />
              <Stat v={compact.format(p.reactions)} k="reactions" />
              <Stat v={compact.format(p.comments)} k="comments" />
              <Stat v={compact.format(p.shares)} k="shares" />
              <Stat v={pct(p.engagement)} k="engagement" strong />
            </div>
          </div>
        ))}
      </div>
      <Eyebrow className="px-1">Source · LinkedIn Community Management API</Eyebrow>
    </div>
  );
}
