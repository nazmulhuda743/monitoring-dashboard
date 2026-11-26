"use client";

import { schedule } from "@/data/brief";
import { fmtDuration, fmtHour } from "@/lib/derive";
import { useBusinessNow } from "@/lib/time";
import { Eyebrow } from "@/components/ui/primitives";

/** The dial covers 07:00–19:00 (12 h) as a full circle. */
const C = 150;
const R = 100;
const DAY_START = 7;
const angle = (t: number) => ((t - DAY_START) / 12) * Math.PI * 2 - Math.PI / 2;
const pt = (t: number, r: number): [number, number] => [+(C + r * Math.cos(angle(t))).toFixed(2), +(C + r * Math.sin(angle(t))).toFixed(2)];
const arc = (a: number, b: number, r: number) => {
  const [x1, y1] = pt(a, r);
  const [x2, y2] = pt(b, r);
  return `M${x1} ${y1} A${r} ${r} 0 ${b - a > 6 ? 1 : 0} 1 ${x2} ${y2}`;
};
const KIND_COLOR = { n: "#C9D0D6", focus: "#1FE0A0", flag: "#F5B13D", lunch: "rgba(255,255,255,.2)" } as const;

export function FocusDial() {
  // Always Curaçao time, regardless of the viewer's device time zone.
  const real = useBusinessNow().hours;
  const now = Math.min(18.999, Math.max(DAY_START, real));
  const inNow = schedule.find((e) => real >= e.start && real < e.end);
  const next = schedule.find((e) => e.start > real);
  const clk = inNow
    ? { label: `Now ${fmtHour(real)} · in`, title: inNow.dialTitle, sub: `ends in ${fmtDuration((inNow.end - real) * 60)}` }
    : next
      ? { label: `Now ${fmtHour(real)} · next`, title: next.dialTitle, sub: `in ${fmtDuration((next.start - real) * 60)}` }
      : { label: `Now ${fmtHour(real)}`, title: "Evening is free", sub: "last meeting ended 16:30" };

  const [n1, n2, nd] = [pt(now, R - 30), pt(now, R + 24), pt(now, R)];

  return (
    <div className="relative aspect-square w-[min(100%,330px)]">
      <svg viewBox="0 0 300 300" width="100%" height="100%" className="block overflow-visible">
        <defs>
          <filter id="bdGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={5} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,.055)" strokeWidth={16} />
        <circle cx={C} cy={C} r={R - 24} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={1} strokeDasharray="2 5" />
        <path d={arc(DAY_START, now, R)} fill="none" stroke="rgba(31,224,160,.16)" strokeWidth={16} />
        {Array.from({ length: 48 }, (_, i) => {
          const t = DAY_START + i * 0.25;
          const major = i % 4 === 0;
          const [x1, y1] = pt(t, R + 13);
          const [x2, y2] = pt(t, R + (major ? 21 : 16));
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={major ? "rgba(255,255,255,.38)" : "rgba(255,255,255,.12)"} strokeWidth={major ? 1.5 : 1} />;
        })}
        {[7, 10, 13, 16].map((t) => {
          const [x, y] = pt(t, R + 34);
          return (
            <text key={t} x={x} y={y} fill="#6B7480" fontSize={10.5} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-mono)" }}>
              {String(t).padStart(2, "0")}
            </text>
          );
        })}
        {schedule.map((e) => (
          <path
            key={e.t}
            d={arc(e.start + 0.03, e.end - 0.03, R)}
            fill="none"
            stroke={KIND_COLOR[e.kind]}
            strokeWidth={16}
            filter={e.kind === "focus" || e.kind === "flag" ? "url(#bdGlow)" : undefined}
          />
        ))}
        <line x1={n1[0]} y1={n1[1]} x2={n2[0]} y2={n2[1]} stroke="#F2F5F7" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={nd[0]} cy={nd[1]} r={6} fill="#05070A" stroke="#1FE0A0" strokeWidth={2.5} filter="url(#bdGlow)" style={{ animation: "bdNow 2.4s ease-in-out infinite" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
        <Eyebrow>{clk.label}</Eyebrow>
        <span className="max-w-[150px] text-[24px] leading-[1.1] font-semibold tracking-[-.03em] text-balance text-fg-strong">{clk.title}</span>
        <span className="font-mono text-[13px] font-medium text-mint">{clk.sub}</span>
      </div>
    </div>
  );
}
