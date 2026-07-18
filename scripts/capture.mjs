// Reusable capture: load a work-board hash route at a viewport and screenshot it,
// matching how the goldens were captured (dark, dsf 2, 1440x900 / 390x844).
// Usage: node scripts/capture.mjs <baseUrl> <outDir> [view:hash ...]
//   node scripts/capture.mjs http://localhost:5188 /tmp/shots overview:#/ board:#/board
import pw from '/Users/z/work/luxfi/ui/node_modules/@playwright/test/index.js';
import { mkdirSync } from 'node:fs';
const { chromium } = pw;

const base = process.argv[2] || 'http://localhost:5188';
const outDir = process.argv[3] || '/private/tmp/claude-501/-Users-z-work-lux-private/a30ef7fe-e14c-464e-8783-67708506331d/scratchpad/shots';
const specs = process.argv.slice(4);
const DEFAULT = [
  'overview:#/', 'board:#/board', 'open-tasks:#/space/engineering/tasks',
  'leaderboards:#/leaderboards', 'suggestions:#/suggestions', 'space:#/space/engineering/board',
  'task-detail:#/board?task=0', 'explore:#/explore',
];
const views = (specs.length ? specs : DEFAULT).map((s) => {
  const i = s.indexOf(':');
  return { view: s.slice(0, i), hash: s.slice(i + 1) };
});
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
mkdirSync(outDir, { recursive: true });

const errors = [];
const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`[${vp.name}] PAGEERROR ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`[${vp.name}] ${m.text()}`); });
  for (const { view, hash } of views) {
    await page.goto(`${base}/${hash}`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(700); // settle fixture render + fonts
    await page.screenshot({ path: `${outDir}/${view}-${vp.name}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify({ captured: views.map((v) => v.view), viewports: VIEWPORTS.map((v) => v.name), errors: errors.slice(0, 15) }, null, 2));
