#!/usr/bin/env node
// Page test: opens every page of the built app (public/) in Chrome, on desktop and phone sizes,
// presses each page's main button and checks that it loads, works and shows no script errors.
//
//   npm run test:pages            all pages, desktop and phone
//   npm run test:pages -- --quick desktop only, no calculations
//
// Uses the Chrome installed on this computer (playwright-core, no browser download).
import { spawn } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4190 + Math.floor(Math.random() * 50);
const QUICK = process.argv.includes('--quick');
const BASE = `http://localhost:${PORT}/`;
// Pages whose main button needs input first, and what to enter.
const PREPARE = {
  'horary-answers': async (p) => { await p.fill('#hqNum', '108'); },
};
// Pages with no result to wait for after the main button (it sets alarms or draws a map).
const NO_OUTPUT = new Set(['live-transit-clock', 'astrocartography', 'cuspal-chart', 'about', 'now', 'lagna-timings']);
// Messages that are the browser's, not the app's.
const IGNORE = /navigator\.vibrate|Banner not shown|apple-mobile-web-app-capable|favicon/i;

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
} catch (e) {
  server.kill();
  console.error('Chrome was not found. Install Google Chrome, or run: npx playwright install chromium');
  process.exit(2);
}

const today = new Date();
const day = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const SIZES = QUICK ? [['desktop', { width: 1440, height: 900 }]] :
  [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }]];

let failures = 0;
for (const [name, size] of SIZES) {
  const { isMobile, hasTouch, ...viewport } = size;
  const ctx = await browser.newContext({ viewport, isMobile: !!isMobile, hasTouch: !!hasTouch, serviceWorkers: 'block' });
  // A returning visitor: setup done, today's disclaimer accepted, a home place chosen.
  await ctx.addInitScript((d) => {
    try {
      localStorage.setItem('rvSetup', '1'); localStorage.setItem('rvDiscDay', d);
      if (!localStorage.getItem('ga_place')) localStorage.setItem('ga_place', JSON.stringify({ lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', src: 'manual', name: 'Chennai', cc: 'India', st: 'Tamil Nadu' }));
    } catch (e) {}
  }, day);
  const page = await ctx.newPage();
  let errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e).split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text().split('\n')[0]); });

  await page.goto(BASE + '#/now');
  await page.waitForFunction(() => !document.documentElement.classList.contains('rv-boot'), null, { timeout: 30000 });
  const routes = await page.$$eval('.rv-groups .tool[data-route]', (bs) => bs.map((b) => ({ route: b.dataset.route, btn: b.id })));
  console.log(`\n${name} (${viewport.width}×${viewport.height}): ${routes.length} pages`);

  for (const { route, btn } of routes) {
    errors = [];
    const problems = [];
    await page.goto(`${BASE}?p=${route}#/${route}`);
    try { await page.waitForFunction(() => !document.documentElement.classList.contains('rv-boot'), null, { timeout: 30000 }); }
    catch (e) { problems.push('the page stayed behind the start-up splash'); }
    await page.waitForTimeout(300);
    const state = await page.evaluate(({ route, btn }) => {
      const base = route === 'now' || route === 'lagna-timings';
      const panel = document.getElementById(btn.replace(/Btn$/, 'Panel'));
      const shown = base ? document.getElementById(route === 'now' ? 'nowcard' : 'mainForm') : panel;
      const r = shown ? shown.getBoundingClientRect() : { height: 0 };
      const sc = document.getElementById('scroller');
      return {
        hash: location.hash, on: (document.querySelector('.rv-groups .tool.rv-on') || {}).id,
        visible: !!shown && getComputedStyle(shown).display !== 'none' && r.height > 40,
        wide: Math.max(document.documentElement.scrollWidth, sc ? sc.scrollWidth : 0) > innerWidth + 1,
        hasGo: !!(panel && panel.querySelector('.btns > button.primary')),
      };
    }, { route, btn });
    if (state.hash !== '#/' + route) problems.push(`address is ${state.hash}`);
    if (state.on !== btn) problems.push(`sidebar highlights ${state.on}`);
    if (!state.visible) problems.push('page content is not visible');
    if (state.wide) problems.push('page is wider than the screen');

    if (!QUICK && state.hasGo && !NO_OUTPUT.has(route)) {
      if (PREPARE[route]) await PREPARE[route](page);
      const panelSel = '#' + btn.replace(/Btn$/, 'Panel');
      await page.click(`${panelSel} .btns > button.primary`);
      try {
        await page.waitForFunction((sel) => {
          const p = document.querySelector(sel), out = p && p.querySelector('[id$="Out"]');
          return out && out.innerText.trim().length > 20;
        }, panelSel, { timeout: 20000 });
      } catch (e) { problems.push('no result after pressing the main button'); }
    }
    if (errors.length) problems.push('script errors: ' + [...new Set(errors)].slice(0, 3).join(' | '));
    if (problems.length) failures++;
    console.log(`${problems.length ? 'FAIL' : 'PASS'}  #/${route}${problems.length ? '  ' + problems.join('; ') : ''}`);
  }
  await ctx.close();
}
await browser.close();
server.kill();
console.log(failures ? `\n${failures} page check(s) failed.` : '\nAll pages load and work.');
process.exit(failures ? 1 : 0);
