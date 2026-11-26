"use client";

import type { ReactElement } from "react";
import { posts } from "@/data/brief";
import { Eyebrow } from "@/components/ui/primitives";
import { useBrief } from "./BriefProvider";

type Pull = { c: string; t: string };

const EASE = "cubic-bezier(.75,0,.2,1)";
// Geometry inside the 1000×470 viewBox.
const CX = 500;
const CY = 400;
const R = 52;
const RX = 285;
const RY = 180;
const BASE = CY - R - 8;
const LEN_FOCUSED = BASE - 16;

/**
 * Arrows radiate from "ENERGY" toward every open thread (scattered). In focus
 * mode they rotate to point straight up, all but the first fade, and the
 * survivor stretches toward the one task that matters.
 */
function EnergyVisual({ pulls, focus }: { pulls: Pull[]; focus: boolean }) {
  const n = pulls.length;
  const arrows: ReactElement[] = [];
  const labels: ReactElement[] = [];
  // Draw back-to-front so index 0 (the essential arrow) sits on top.
  for (let i = n - 1; i >= 0; i--) {
    let a = (i * 360) / n;
    if (a > 180) a -= 360;
    const ra = (a * Math.PI) / 180;
    const dx = RX * Math.sin(ra);
    const dy = RY * Math.cos(ra);
    const dist = Math.hypot(dx, dy);
    const dir = (Math.atan2(dx, dy) * 180) / Math.PI;
    const main = i === 0;
    const len = focus ? LEN_FOCUSED : Math.max(30, Math.min(170, dist - R - 36));
    const col = focus ? "#1FE0A0" : pulls[i].c;
    const delay = focus ? i * 0.035 : (n - i) * 0.025;
    const tr = `transform 1.5s ${EASE} ${delay}s`;
    arrows.push(
      <g
        key={`a${i}`}
        filter={focus && main ? "url(#enGlow)" : undefined}
        style={{
          transform: `rotate(${focus ? 0 : dir}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transformBox: "view-box",
          opacity: focus && !main ? 0 : 1,
          transition: `${tr}, opacity .9s ease ${focus ? ".7s" : "0s"}`,
        }}
      >
        <rect
          x={CX - 2}
          y={BASE - 1}
          width={4}
          height={1}
          fill={col}
          style={{ transformOrigin: `${CX}px ${BASE}px`, transformBox: "view-box", transform: `scaleY(${len})`, transition: `${tr}, fill .8s ease` }}
        />
        <path
          d={`M${CX - 13} 14 L${CX} 0 L${CX + 13} 14`}
          fill="none"
          stroke={col}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: `translate(0px,${BASE - len}px)`, transformBox: "view-box", transition: `${tr}, stroke .8s ease` }}
        />
      </g>,
    );
    const sx = Math.sin(ra);
    const cs = Math.cos(ra);
    labels.push(
      <text
        key={`l${i}`}
        className="max-sm:hidden"
        x={(CX + dx).toFixed(1)}
        y={(CY - dy).toFixed(1)}
        fill={pulls[i].c}
        fontSize={25}
        fontWeight={500}
        letterSpacing="-.01em"
        textAnchor={sx > 0.25 ? "start" : sx < -0.25 ? "end" : "middle"}
        dominantBaseline={cs > 0.6 ? "auto" : cs < -0.6 ? "hanging" : "central"}
        style={{ fontFamily: "var(--font-sans)", opacity: focus ? 0 : 0.92, transition: `opacity .6s ease ${focus ? "0s" : `${1.1 + (n - i) * 0.03}s`}` }}
      >
        {pulls[i].t}
      </text>,
    );
  }
  // Original interleaves arrow/label per index; keep that paint order.
  const kids = arrows.flatMap((a, k) => [a, labels[k]]);

  return (
    <svg viewBox="0 0 1000 470" width="100%" height="100%" className="block overflow-visible">
      <defs>
        <filter id="enGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={6} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g style={{ transform: `translateY(${focus ? 0 : -170}px)`, transformBox: "view-box", transition: `transform 1.5s ${EASE}${focus ? " .1s" : " 0s"}` }}>
        {kids}
        <line
          x1={CX}
          y1={BASE - 4}
          x2={CX}
          y2={30}
          stroke="#C8FFEA"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="3 22"
          style={{ animation: "bdFlow 1s linear infinite", opacity: focus ? 0.95 : 0, transition: `opacity .6s ease ${focus ? "1.5s" : "0s"}` }}
        />
        <g style={{ opacity: focus ? 1 : 0, transition: `opacity .8s ease ${focus ? "1.2s" : "0s"}` }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1FE0A0" strokeWidth={2} style={{ transformOrigin: `${CX}px ${CY}px`, transformBox: "view-box", animation: "bdRing 2.6s ease-out infinite" }} />
        </g>
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill={focus ? "rgba(31,224,160,.14)" : "rgba(255,255,255,.03)"}
          stroke={focus ? "#1FE0A0" : "#E8ECEF"}
          strokeWidth={3.5}
          filter={focus ? "url(#enGlow)" : undefined}
          style={{ transition: "fill 1.2s, stroke 1.2s" }}
        />
        <text x={CX} y={CY} fill={focus ? "#1FE0A0" : "#9BA4AE"} fontSize={13} letterSpacing=".12em" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-mono)", transition: "fill 1.2s" }}>
          ENERGY
        </text>
      </g>
    </svg>
  );
}

const TITLE = "m-0 text-[clamp(28px,3.8vw,48px)] leading-[1.06] font-semibold tracking-[-.045em] text-balance text-fg-strong";

export function EnergySection() {
  const { data, active, postDecision, nudged, focus, goStart } = useBrief();

  const pulls: Pull[] = active.map((n) => ({ c: n.energyColor ?? n.color, t: n.energyLabel }));
  posts.forEach((p) => {
    if (p.energyLabel && !postDecision[p.id]) pulls.push({ c: "#6FA4FA", t: p.energyLabel });
  });
  data.waiting.forEach((w) => {
    if (w.s === "late" && !nudged[w.id]) pulls.push({ c: "#F26B5E", t: w.energyLabel ?? `${w.what.slice(0, 18)} · late` });
  });
  pulls.push(...data.otherPulls);
  const shown = pulls.slice(0, 16);
  const n = shown.length;
  const essential = active[0]?.title ?? "Protect the focus block for next quarter";

  const layerA = { opacity: focus ? 0 : 1, transform: focus ? "translateY(-10px)" : "none", pointerEvents: focus ? "none" : "auto", zIndex: focus ? 1 : 2 } as const;
  const layerB = { opacity: focus ? 1 : 0, transform: focus ? "none" : "translateY(12px)", pointerEvents: focus ? "auto" : "none", zIndex: focus ? 2 : 1 } as const;
  const modeFg = focus ? "#1FE0A0" : "#8A939D";

  return (
    <div
      className="glass flex flex-col items-center gap-1.5 overflow-hidden rounded-[28px]! px-[clamp(14px,3vw,40px)] pt-[clamp(30px,4vw,56px)] pb-[26px] text-center"
    >
      <span className="pointer-events-none absolute -bottom-75 left-1/2 h-150 w-205 -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(closest-side,rgba(31,224,160,.13),transparent)" }} />
      <span
        className="pointer-events-none absolute -top-65 left-1/2 h-120 w-190 -translate-x-1/2 rounded-full transition-opacity duration-[1.4s] ease-in-out"
        style={{ background: "radial-gradient(closest-side,rgba(31,224,160,.2),transparent)", opacity: focus ? 1 : 0 }}
      />
      <div className="relative grid w-full max-w-[780px]">
        <div className="relative flex flex-col items-center justify-end gap-3.5 [grid-area:1/1]" style={{ ...layerA, transition: "opacity .8s ease,transform .8s ease" }}>
          <Eyebrow color="#8A939D">Right now</Eyebrow>
          <span className={TITLE}>
            <span className="font-mono tracking-[-.06em] text-amber">{n}</span> things are pulling at your energy.
          </span>
          <span className="text-[16px] leading-normal text-muted-2">Spread this thin, nothing moves far.</span>
        </div>
        <div className="relative flex flex-col items-center justify-end gap-3.5 [grid-area:1/1]" style={{ ...layerB, transition: "opacity .9s ease .5s,transform .9s ease .5s" }}>
          <Eyebrow color="#1FE0A0">Only one moves the company today</Eyebrow>
          <span className={TITLE} style={{ textShadow: "0 0 50px rgba(31,224,160,.3)" }}>
            {essential}
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5">
            <a
              role="button"
              onClick={(e) => {
                e.preventDefault();
                goStart();
              }}
              href="#a-needs"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-mint px-[19px] py-[11px] text-[13.5px] font-semibold text-mint-ink hover:bg-mint-hover hover:text-mint-ink"
              style={{ boxShadow: "0 10px 34px -8px rgba(31,224,160,.75),inset 0 1px 0 rgba(255,255,255,.4)" }}
            >
              Start here <span className="font-mono">↑</span>
            </a>
            <span className="font-mono text-[12px] text-dim">the other {Math.max(0, n - 1)} can wait</span>
          </div>
        </div>
      </div>
      <div className="relative aspect-[1000/470] w-full max-w-[1000px]">
        <EnergyVisual pulls={shown} focus={focus} />
      </div>
      {/* Phones: SVG labels would be ~8px, so list the threads as chips instead. */}
      <div
        className="relative mt-2 mb-1 flex flex-wrap justify-center gap-1.5 transition-opacity duration-700 sm:hidden"
        style={{ opacity: focus ? 0.35 : 1 }}
      >
        {shown.map((p, i) => (
          <span
            key={p.t}
            className="flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1 text-[11.5px] font-medium"
            style={{ color: p.c, background: "rgba(255,255,255,.03)", opacity: focus && i > 0 ? 0.5 : 1 }}
          >
            <span className="size-1.5 rounded-full" style={{ background: p.c }} />
            {p.t}
          </span>
        ))}
      </div>
      <span className="relative flex items-center gap-2 font-mono text-[11px] font-medium tracking-[.08em] uppercase transition-colors duration-[.6s]" style={{ color: modeFg }}>
        <span className="size-1.5 rounded-full transition-[background] duration-[.6s]" style={{ background: modeFg }} />
        {focus ? "Essential · one direction" : `Scattered · ${n} directions`}
      </span>
    </div>
  );
}
