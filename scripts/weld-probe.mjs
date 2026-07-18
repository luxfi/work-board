// Isolated weld probe runner: loads /weldcheck.html, asserts the @luxfi/ui
// Button rendered and the Input round-trips keystrokes, and screenshots it.
// Run: node scripts/weld-probe.mjs  (Playwright resolved from ~/work/luxfi/ui)
import pw from '/Users/z/work/luxfi/ui/node_modules/@playwright/test/index.js';
const { chromium } = pw;

const URL = process.env.WELD_URL || 'http://localhost:5188/weldcheck.html';
const OUT = process.env.WELD_OUT || '/private/tmp/claude-501/-Users-z-work-lux-private/a30ef7fe-e14c-464e-8783-67708506331d/scratchpad/weld.png';

const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 480 }, deviceScaleFactor: 2, colorScheme: 'dark' });
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(800);

const btn = page.getByTestId('btn');
const btnVisible = await btn.isVisible().catch(() => false);
const btnText = (await btn.textContent().catch(() => '')) || '';

// Round-trip: type into the @luxfi/ui Input, assert the controlled echo updates.
const inp = page.getByTestId('inp');
await inp.click();
await inp.type('hello123', { delay: 20 });
const echo = ((await page.getByTestId('echo').textContent().catch(() => '')) || '').trim();
const inpValue = await inp.inputValue().catch(() => '');

await page.screenshot({ path: OUT });
await browser.close();

const roundTrip = echo === 'echo:hello123' && inpValue === 'hello123';
console.log(JSON.stringify({
  btnVisible, btnText: btnText.trim(), inpValue, echo, roundTrip,
  consoleErrors: errors.slice(0, 10),
}, null, 2));
process.exit(btnVisible && roundTrip && errors.length === 0 ? 0 : 1);
