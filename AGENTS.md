<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Monitoring Dashboard ("Morning brief") — project notes

Read this whole file first, every session. It is the project's memory.
The Next.js block above is auto-maintained by Next — this is **Next 16**, check
`node_modules/next/dist/docs/` before using any Next API you're unsure about.

## What this is

A single-page, desktop-first **CEO morning brief** for Bionda Fonseca (CEO of
CDS — Caribglobal Data Services — and YamaMi marketplace). It pulls signals
from **Freshdesk, ClickUp, LinkedIn and Google Calendar** and answers: what
needs me today, what am I waiting on, how are projects / key clients / content /
support doing, what did I decide, and is everything else fine.

- **Approved design:** `design/Bionda_Dashboard.html` (bundled export — open in
  a browser). Readable source of that design (markup + logic + data):
  `design/design-source.html`. When in doubt about a value, grep it there.
- **Phase 1 (done):** pixel-match the design at 1440px desktop, using mock data.
- **Phase 2 (done):** responsive — tablet and phone layouts (no design for these; ours).
- **Next phases:** live integrations (see Roadmap).

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, `src/`), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 (CSS-first config in `src/app/globals.css` `@theme`) |
| Fonts | `next/font/google`: Geist, Geist Mono, Instrument Serif (vars `--font-geist*`, `--font-instrument-serif` → Tailwind `font-sans/mono/serif`) |
| Visuals | Hand-written SVG (focus dial, energy visual), absolutely positioned divs (renewal runway). **No chart library.** |
| State | One React context: `src/components/dashboard/BriefProvider.tsx` |
| Verify | Playwright (preinstalled globally) + pixelmatch: `npm run compare` |

## Commands

```bash
npm run dev          # http://localhost:3000
npm run build        # production build (must pass before commit)
npm start            # serve the build on :3000
npm run lint         # eslint (must be clean)
npm run typecheck    # tsc --noEmit
npm run compare      # needs `npm start` running; diffs app vs design at 1440px
node scripts/compare-design.cjs 1800 400   # + side-by-side crop of a band → .compare/crop.png
npm run shoot:mobile # needs `npm start`; iPhone/360px/tablet screenshots + overflow check → .compare/mobile/
```

`?at=HH:MM` in the URL pins the time of day, in Curaçao time (e.g. `/?at=09:37`).
If `next start` serves 500s for CSS/JS chunks after a rebuild, kill the old
server (`pkill -f next-server`), `rm -rf .next`, rebuild, restart.

## Layout of the code

```
src/app/layout.tsx            fonts + <html>
src/app/page.tsx              composes the page (sidebar + main column)
src/app/globals.css           design tokens (@theme), base, component classes, keyframes
src/data/types.ts             domain types = contract for future API adapters
src/data/brief.ts             all mock data (copied verbatim from the design)
src/lib/tones.ts              semantic tones {fg, tint}: red/blue/amber/mint/grey
src/lib/derive.ts             pure helpers (decisions list, duration formatting)
src/lib/time.ts               Curaçao business clock (all displayed times go through it)
src/components/ui/primitives  Pill, PillRow, Eyebrow, SectionHeader, Section, Field
src/components/dashboard/     one file per page block:
  BriefProvider   state + actions (done/later, approvals, nudges, open panels, energy loop)
  Background      fixed aurora/grid/noise backdrop
  Sidebar         nav w/ scroll-spy + live counts: fixed sidebar ≥lg, top bar + drawer <lg
  Hero, FocusDial greeting + 07:00–19:00 day dial
  EnergySection   "N things pulling → one direction" animated SVG
  SummaryCards    3 summary cards + business pulse strip
  NeedsSection    01 needs-you cards + today's calendar w/ meeting prep
  WaitingSection  02 · ProjectsSection 03 · ClientsSection 04 (renewal runway)
  ContentSection  05 week list / December month grid · SupportSection 06
  DecisionsSection 07 · EverythingElseSection 08 + closing line
```

Section anchors (used by nav + scroll-spy): `#top #a-needs #a-waiting
#a-projects #a-clients #a-content #a-support #a-decisions #a-else`.

## Design rules (important — these are what keep it pixel-exact)

1. **Colors come from tokens.** Tailwind classes like `text-mint`, `text-muted-2`,
   `bg-panel`, or `T.red.fg` / `T.mint.tint` from `src/lib/tones.ts`. Don't invent
   new hexes; if the design has one we lack, add it to `@theme` with a name.
2. **Reuse the component classes** in `globals.css`: `.glass` (every card),
   `.eyebrow` (mono uppercase labels), `.pill` / `.pill-sm`, `.src-tag`,
   `.btn-primary/-outline/-neutral/-text/-link`, `.inset-panel`, `.row-divider`.
3. **Line-height:** the design uses the CSS `font:` shorthand, which resets
   line-height to `normal`. `body` is therefore `line-height: normal`. Only add a
   `leading-*` class when the design specifies one (`/1.5` → `leading-normal`,
   `/1.4` → `leading-[1.4]`). Tailwind `leading-normal` = 1.5, not `normal`.
4. **Box-sizing gotcha:** the design is `content-box`; Tailwind is `border-box`.
   Any element with padding/border **and** a width, max-width or flex-basis must
   add the padding+border to the number (e.g. calendar card basis 320→358px,
   post preview max-width 640→678px), or use `box-content`.
5. Font sizes use arbitrary values copied from the design (`text-[13.5px]`),
   never Tailwind's named sizes (they also set line-height).
6. Animations: keyframes `bdDrift1-3, bdPulse, bdFlow, bdRing, bdNow` live in
   `globals.css`; `prefers-reduced-motion` disables all motion.
7. Anything that reads the clock / `window` runs in `useEffect` (SSR-safe, and
   Next 16 Cache Components is on). Don't call `setState` synchronously in an
   effect body (lint rule) — use a timer/callback.
8. **Responsive.** Desktop (`lg`, ≥1024px) must stay pixel-identical to the
   design — put every responsive change behind an unprefixed/`sm:`/`max-sm:`
   value whose `lg` result is the design value, then re-run `npm run compare`.
   Below `lg`: sidebar → fixed 60px top bar + slide-in drawer (`MobileBar` in
   Sidebar.tsx), main gets `pt-[84px]`, sections `scroll-mt-[84px]`, 16px side
   gutters, 64px section gap. Below `sm` (<640px): energy labels become chips,
   support table becomes per-agent cards, coverage rows stack, renewal runway
   and December grid scroll sideways inside their cards. Nothing may make the
   page itself scroll sideways (`npm run shoot:mobile` reports overflow).
9. **Time zone: everything is Curaçao time** (`America/Curacao`, Willemstad,
   UTC−4, no DST) — the client lives there. Never use `getHours()`,
   `toLocaleString()` without `timeZone`, or other device-local time. Use
   `src/lib/time.ts`: `useBusinessNow()` for live values, `formatBusinessTime()`
   for API timestamps (UTC ISO → Curaçao HH:MM), `dateLine()` for the header.
   Server/first paint use `REFERENCE_TIME` (Mon 23 Nov 2026 09:37) to avoid
   hydration mismatches; the live clock takes over after mount.
10. The sidebar is `position: fixed` (not sticky) and `html` has
   `overscroll-behavior: none` — the user explicitly wants it to never move.

## How to work here

- Before finishing any UI change: `npm run lint && npm run typecheck && npm run build`,
  then `npm start` + `npm run compare` + `npm run shoot:mobile` (look at the sheets). Expected: same total height as the design
  (9289px at 1440), sections within ±1px, pixel diff < 1%. Look at
  `.compare/diff.png` / a crop for anything new.
- Interactive parity was verified by clicking the same controls on both pages
  (Mark done, Later today, Nudge, Approve, Ask for changes, project & meeting
  toggles, Next week/December) — keep behaviour identical to `design-source.html`
  (`class Component` at the bottom holds the original logic).
- Keep data out of components: add/modify fields in `src/data/types.ts` +
  `src/data/brief.ts`; components consume them.
- Git: develop on the branch the session specifies; small, descriptive commits.
- **Never put AI/assistant names in anything pushed to GitHub** — no
  "Co-Authored-By"/session trailers in commit messages, no assistant name as
  git author, no mentions in code, comments or docs. Commit as
  `nazmulhuda743 <nazmulhuda743@users.noreply.github.com>`.
- The user prefers concise updates and an honest status (what's verified, what isn't).

## Known, accepted differences from the design export

- Arrows `→ ↗ ↑` render in Geist Mono here; the export fell back to a system
  font for those glyphs (slightly wider). Ours is the intended font.
- ±1px vertical offsets from sub-pixel rounding.

## Roadmap

1. ✅ Desktop pixel-match with mock data.
2. Data adapters behind `src/data/types.ts`: Freshdesk (API key), ClickUp (API
   token), Google Calendar (OAuth) — via Next route handlers / server code,
   secrets in env vars, never in the client. LinkedIn: the API doesn't expose
   another person's scheduled posts easily — likely needs a scheduler tool
   (e.g. the team's social tool) or manual input; decide with the user first.
3. Real actions (Mark done → ClickUp/Freshdesk updates, Approve → post status),
   persistence of local state.
4. ✅ Responsive / mobile pass.
