/**
 * Visual regression check: our app vs the approved design export.
 *
 *   npm run build && npm start          # in one terminal (port 3000)
 *   npm run compare                     # in another
 *
 * Renders both at 1440×900 with the clock pinned to Mon 23 Nov 2026 09:37,
 * prints each section's top/height side by side, and writes full-page
 * screenshots + a pixel diff to .compare/ (gitignored).
 *
 * Expected today (v2, 1440px): total height 10701, sections within ±1px,
 * <1% pixels different (sub-pixel text anti-aliasing only).
 *
 * Optional: node scripts/compare-design.cjs <y> <h>  → also writes
 * .compare/crop.png showing original | ours | diff for that vertical band.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, ".compare");
// Current approved design: v2 (adds section 06 "CDS on LinkedIn"). It loads
// design/support.js (the design tool runtime, extracted from the v1 export).
const DESIGN = "file://" + path.join(ROOT, process.env.DESIGN_FILE || "design/Bionda_Dashboard_v2.dc.html");
const APP = process.env.APP_URL || "http://localhost:3000/";
const SECTIONS = ["top", "a-needs", "a-waiting", "a-projects", "a-clients", "a-content", "a-linkedin", "a-support", "a-decisions", "a-else"];

async function grab(browser, url, tag) {
  // The design export reads the device clock, our app reads Curaçao time:
  // run the browser in Curaçao so both show Mon 23 Nov 2026, 09:37.
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, timezoneId: "America/Curacao" });
  await page.clock.setFixedTime(new Date("2026-11-23T09:37:00-04:00"));
  await page.goto(url);
  await page.waitForTimeout(6000); // energy visual settles into "essential" mode
  const info = await page.evaluate((ids) => ({
    height: document.documentElement.scrollHeight,
    sections: Object.fromEntries(
      ids.map((id) => {
        const el = document.getElementById(id);
        if (!el) return [id, null];
        const r = el.getBoundingClientRect();
        return [id, [Math.round(r.top + scrollY), Math.round(r.height)]];
      }),
    ),
  }), SECTIONS);
  await page.screenshot({ path: path.join(OUT, `${tag}.png`), fullPage: true });
  await page.close();
  return info;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const a = await grab(browser, DESIGN, "design");
  const b = await grab(browser, APP, "app");
  await browser.close();

  console.log(`height   design ${a.height}   app ${b.height}`);
  for (const id of SECTIONS) console.log(id.padEnd(12), JSON.stringify(a.sections[id]).padEnd(14), JSON.stringify(b.sections[id]));

  const A = PNG.sync.read(fs.readFileSync(path.join(OUT, "design.png")));
  const B = PNG.sync.read(fs.readFileSync(path.join(OUT, "app.png")));
  const w = Math.min(A.width, B.width);
  const h = Math.min(A.height, B.height);
  const crop = (img) => {
    const o = new PNG({ width: w, height: h });
    PNG.bitblt(img, o, 0, 0, w, h, 0, 0);
    return o;
  };
  const [cA, cB] = [crop(A), crop(B)];
  const D = new PNG({ width: w, height: h });
  const n = pixelmatch(cA.data, cB.data, D.data, w, h, { threshold: 0.15 });
  fs.writeFileSync(path.join(OUT, "diff.png"), PNG.sync.write(D));
  console.log(`pixel diff ${n} / ${w * h} (${((100 * n) / (w * h)).toFixed(2)}%)  → .compare/diff.png`);

  const [y, bandH] = process.argv.slice(2).map(Number);
  if (bandH) {
    const o = new PNG({ width: w * 3 + 20, height: bandH });
    [cA, cB, D].forEach((img, i) => PNG.bitblt(img, o, 0, y, w, bandH, i * (w + 10), 0));
    fs.writeFileSync(path.join(OUT, "crop.png"), PNG.sync.write(o));
    console.log("band written → .compare/crop.png (design | app | diff)");
  }
})();
