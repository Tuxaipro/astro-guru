#!/usr/bin/env node
// Style check for refactoring CSS: records the computed style of every visible element on every page
// (desktop and phone), then compares a later build with it. Nothing should change unless intended.
//
//   node scripts/style-diff.mjs --save     record the current build as the reference (tests/styles.json)
//   node scripts/style-diff.mjs            compare the current build with the reference
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REF = join(ROOT, 'tests', 'styles.json');
const SAVE = process.argv.includes('--save');
const PORT = 4250 + Math.floor(Math.random() * 50);
const BASE = `http://localhost:${PORT}/`;
const PROPS = ['display', 'position', 'visibility', 'opacity', 'color', 'background-color', 'font-size', 'font-weight', 'font-family',
  'padding', 'margin', 'border-radius', 'border-top-width', 'border-top-color', 'gap', 'grid-template-columns', 'flex-direction',
  'justify-content', 'align-items', 'z-index', 'text-align', 'box-shadow', 'min-height', 'height', 'width'];
// Text that changes by itself (clocks, the rising sign) is left out.
const SKIP = '#clPanel .clface, #clPanel .cldig, #list > li, .rbell, #ptable, #cuspTab tbody';

const server = spawn(process.execPath, [join(ROOT, 'scripts', 'serve.mjs'), String(PORT)], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const day = (() => { const t = new Date(); return `${t.getFullYear()}-${t.getMonth() + 1}-${t.getDate()}`; })();
const out = {};
for (const [name, size] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, isMobile: true }]]) {
  const { isMobile, ...viewport } = size;
  const ctx = await browser.newContext({ viewport, isMobile: !!isMobile, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.addInitScript((d) => { localStorage.setItem('rvSetup', '1'); localStorage.setItem('rvDiscDay', d); localStorage.setItem('rvAppear', 'dark');
    if (!localStorage.getItem('ga_place')) localStorage.setItem('ga_place', JSON.stringify({ lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', src: 'manual', name: 'Chennai', cc: 'India', st: 'Tamil Nadu' })); }, day);
  const page = await ctx.newPage();
  await page.goto(BASE + '#/now');
  await page.waitForFunction(() => !document.documentElement.classList.contains('rv-boot'));
  const routes = await page.$$eval('.rv-groups .tool[data-route]', (bs) => bs.map((b) => b.dataset.route));
  for (const route of routes) {
    await page.goto(`${BASE}?s=${route}#/${route}`);
    await page.waitForFunction(() => !document.documentElement.classList.contains('rv-boot'));
    await page.waitForTimeout(400);
    out[`${name} #/${route}`] = await page.evaluate(({ PROPS, SKIP }) => {
      const res = {};
      const path = (el) => { const p = []; for (let e = el; e && e !== document.body; e = e.parentElement) { const i = [...e.parentElement.children].indexOf(e); p.unshift((e.id ? '#' + e.id : e.tagName.toLowerCase()) + ':' + i); if (e.id) break; } return p.join('>'); };
      document.querySelectorAll('body *').forEach((el) => {
        if (el.closest(SKIP) || el.closest('svg') || /^(SCRIPT|STYLE|OPTION|BR)$/.test(el.tagName)) return;
        const cs = getComputedStyle(el); if (cs.display === 'none') return;
        const r = el.getClientRects(); if (!r.length) return;
        const v = {}; PROPS.forEach((p) => { let x = cs.getPropertyValue(p); if (p === 'width' || p === 'height') x = /^(INPUT|SELECT|BUTTON|TEXTAREA)$/.test(el.tagName) ? String(Math.round(parseFloat(x))) : ''; if (x) v[p] = x; });
        res[path(el)] = v;
      });
      return res;
    }, { PROPS, SKIP });
  }
  await ctx.close();
}
await browser.close(); server.kill();

if (SAVE || !existsSync(REF)) {
  mkdirSync(dirname(REF), { recursive: true }); writeFileSync(REF, JSON.stringify(out));
  console.log(`Saved the styles of ${Object.values(out).reduce((n, p) => n + Object.keys(p).length, 0)} elements on ${Object.keys(out).length} pages.`);
} else {
  const ref = JSON.parse(readFileSync(REF, 'utf8'));
  let changed = 0; const sample = {};
  for (const [pg, els] of Object.entries(out)) {
    const was = ref[pg] || {};
    for (const [k, v] of Object.entries(els)) {
      const w = was[k]; if (!w) continue;
      for (const p of Object.keys(v)) if (w[p] !== v[p]) { changed++; const key = `${p}: ${w[p]} → ${v[p]}`; (sample[key] = sample[key] || []).push(`${pg} ${k}`); }
    }
  }
  const keys = Object.keys(sample).sort((a, b) => sample[b].length - sample[a].length);
  console.log(changed ? `${changed} style values changed (${keys.length} kinds):` : 'No style changes.');
  keys.slice(0, 60).forEach((k) => console.log(`  ${sample[k].length}×  ${k}\n        e.g. ${sample[k].slice(0, 2).join('\n             ')}`));
  process.exitCode = changed ? 1 : 0;
}
