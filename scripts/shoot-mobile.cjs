/**
 * Mobile/tablet layout check. Needs `npm start` running.
 *   node scripts/shoot-mobile.cjs
 * Writes .compare/mobile/<device>-full.png plus contact sheets
 * (.compare/mobile/<device>-sheet-N.png) and reports horizontal overflow.
 */
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");
const { PNG } = require("pngjs");

const OUT = path.resolve(__dirname, "../.compare/mobile");
const APP = process.env.APP_URL || "http://localhost:3000/";
const TARGETS = [
  ["iphone", devices["iPhone 13"]],
  ["small", { viewport: { width: 360, height: 740 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }],
  ["tablet", { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 }],
];

function sheets(file, tag, scale) {
  const img = PNG.sync.read(fs.readFileSync(file));
  const w = Math.round(img.width / scale);
  const colH = 900;
  // Downscale by nearest-neighbour sampling so sheets stay small.
  const small = new PNG({ width: w, height: Math.round(img.height / scale) });
  for (let y = 0; y < small.height; y++)
    for (let x = 0; x < w; x++) {
      const si = (Math.min(img.height - 1, Math.round(y * scale)) * img.width + Math.min(img.width - 1, Math.round(x * scale))) * 4;
      const di = (y * w + x) * 4;
      small.data[di] = img.data[si]; small.data[di + 1] = img.data[si + 1]; small.data[di + 2] = img.data[si + 2]; small.data[di + 3] = 255;
    }
  const cols = Math.ceil(small.height / colH);
  const perSheet = Math.max(1, Math.floor(2400 / (w + 12)));
  for (let s = 0; s * perSheet < cols; s++) {
    const n = Math.min(perSheet, cols - s * perSheet);
    const sheet = new PNG({ width: n * (w + 12), height: colH });
    sheet.data.fill(255);
    for (let c = 0; c < n; c++) {
      const y0 = (s * perSheet + c) * colH;
      PNG.bitblt(small, sheet, 0, y0, w, Math.min(colH, small.height - y0), c * (w + 12), 0);
    }
    fs.writeFileSync(path.join(OUT, `${tag}-sheet-${s}.png`), PNG.sync.write(sheet));
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [tag, opts] of TARGETS) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date("2026-11-23T09:37:00"));
    await page.goto(APP);
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const W = document.documentElement.clientWidth;
      const wide = [...document.querySelectorAll("main *")].filter((e) => {
        const b = e.getBoundingClientRect();
        if (b.right <= W + 1) return false;
        // ignore things clipped by an overflow container
        for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (o.overflowX !== "visible") return false;
        }
        return true;
      });
      return { W, docW: document.documentElement.scrollWidth, H: document.documentElement.scrollHeight, overflow: wide.slice(0, 5).map((e) => e.tagName + " " + (e.textContent || "").trim().slice(0, 40)) };
    });
    const file = path.join(OUT, `${tag}-full.png`);
    await page.screenshot({ path: file, fullPage: true });
    sheets(file, tag, opts.deviceScaleFactor || 1);
    console.log(tag, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
