import type { CSSProperties } from "react";

const blob = (s: CSSProperties): CSSProperties => ({ position: "absolute", borderRadius: "50%", willChange: "transform", ...s });

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%27180%27 height=%27180%27><filter id=%27n%27><feTurbulence type=%27fractalNoise%27 baseFrequency=%27.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/></filter><rect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/></svg>\")";

/** Fixed, non-interactive backdrop: drifting aurora blobs, grain, grid and vignette. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div style={blob({ width: 1100, height: 760, top: -420, left: -240, background: "radial-gradient(closest-side, rgba(31,224,160,.20), rgba(31,224,160,.05) 55%, transparent)", animation: "bdDrift1 32s ease-in-out infinite alternate" })} />
      <div style={blob({ width: 920, height: 820, top: -320, right: -320, background: "radial-gradient(closest-side, rgba(76,141,246,.15), transparent)", animation: "bdDrift2 38s ease-in-out infinite alternate" })} />
      <div style={blob({ width: 860, height: 860, top: "45%", left: "28%", background: "radial-gradient(closest-side, rgba(167,123,250,.08), transparent)", animation: "bdDrift3 46s ease-in-out infinite alternate" })} />
      <div style={blob({ width: 720, height: 620, bottom: -320, right: "4%", background: "radial-gradient(closest-side, rgba(31,224,160,.08), transparent)", animation: "bdDrift2 52s ease-in-out infinite alternate-reverse" })} />
      <div className="absolute inset-0 opacity-[.08] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 55% 0%,#000 15%,transparent 72%)",
          maskImage: "radial-gradient(ellipse 75% 55% at 55% 0%,#000 15%,transparent 72%)",
        }}
      />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 70% at 50% 115%,rgba(0,0,0,.65),transparent 60%)" }} />
    </div>
  );
}
