#!/usr/bin/env node
// Regression tests for the GuruAgasthiya engine.
// Loads public/index.html headless (jsdom), runs fixed cases and compares the results with
// tests/snapshots.json. Run after `npm run import` of a new APK to see exactly what changed.
//
//   npm test                 compare with the saved results
//   npm test -- --update     save the current results as the new reference
import { JSDOM, VirtualConsole } from 'jsdom';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'public', 'index.html');
const SNAP = join(ROOT, 'tests', 'snapshots.json');
const UPDATE = process.argv.includes('--update');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- load the app ----------
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push(String(e.message).split('\n')[0]));
// Test the calculation engine only: leave out the interface scripts (the revamp layer and the original
// layout helpers), whose page watchers make jsdom very slow on large reports.
const UI_SCRIPTS = /<script src="(revamp\/[^"]+|js\/0[3-6]-[^"]+)"><\/script>\n?/g;
const html = readFileSync(PAGE, 'utf8').replace(UI_SCRIPTS, '').replace(/<link rel="stylesheet"[^>]*>\n?/g, ''); // styles are not needed to calculate
const dom = new JSDOM(html, {
  url: pathToFileURL(PAGE).href, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    // Browser features jsdom does not have.
    w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.Element.prototype.scrollTo = function () {}; w.Element.prototype.scrollIntoView = function () {}; w.scrollTo = function () {};
    w.requestIdleCallback = (fn) => setTimeout(fn, 1);
    w.HTMLDialogElement && (w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }, w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); });
    // file: pages have no localStorage in jsdom; give the app a fresh in-memory one.
    const mem = new Map();
    const ls = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
    Object.defineProperty(w, 'localStorage', { value: ls, configurable: true });
    ls.setItem('rvSetup', '1'); // no first-run dialog
  },
});
await new Promise((r) => dom.window.addEventListener('load', r));
await sleep(300);
const w = dom.window, d = w.document, $ = (id) => d.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
const text = (el) => (el ? el.innerHTML.replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : null);

function pickPlace(prefix, name, cc) {
  const co = $(prefix + 'Country'), se = $(prefix + 'Search'), ci = $(prefix === 'pl' ? 'place' : prefix + 'City');
  if (co) { co.value = '*a'; fire(co, 'change'); }
  se.value = name; fire(se, 'input');
  const i = [...ci.options].findIndex((o) => o.text.startsWith(name) && o.text.includes(cc));
  if (i < 0) throw new Error(`place not found: ${name}, ${cc}`);
  ci.selectedIndex = i; fire(ci, 'change');
}
function setBirth({ date, time, lat, lon, tz }) {
  const [y, m, dd] = date.split('-').map(Number);
  $('bpYear').value = String(y); $('bpMonth').value = String(m); $('bpDay').value = String(dd);
  const [h, mi, s] = time.split(':').map(Number);
  $('bpHour').value = String(h % 12 || 12); $('bpMin').value = String(mi); $('bpSec').value = String(s || 0); $('bpAmpm').value = h >= 12 ? 'PM' : 'AM';
  ['bpYear', 'bpMonth', 'bpDay', 'bpHour', 'bpMin', 'bpSec', 'bpAmpm'].forEach((i) => fire($(i), 'change'));
  $('bpLat').value = lat; $('bpLon').value = lon; $('bpTz').value = tz;
  ['bpLat', 'bpLon', 'bpTz'].forEach((i) => { fire($(i), 'input'); fire($(i), 'change'); });
}
async function birth(c) {
  setBirth(c); $('bpGo').click(); await sleep(600);
  const out = $('bpOut');
  const born = [...out.querySelectorAll('.lf-time')].map(text).find((t) => /Born/.test(t)) || text(out.querySelector('.lf-time'));
  const table = [...out.querySelectorAll('table')].find((t) => /Position/.test(t.textContent) && /Sub/.test(t.textContent));
  const planets = table ? [...table.querySelectorAll('tbody tr')].map((tr) => [...tr.cells].slice(0, 5).map((td) => text(td)).join(' | ')) : [];
  return { born, planets };
}
async function timings(date, time) {
  $('date').value = date; $('time').value = time; fire($('date'), 'change'); fire($('time'), 'change');
  $('go').click(); await sleep(600);
  const rows = [...d.querySelectorAll('#list > li.row')].map((li) => {
    const t = li.querySelector('.t b'), n = li.querySelector('.n'), dt = li.querySelector('.rdate span');
    return `${dt ? dt.textContent + ' ' : ''}${t ? t.textContent : ''} ${n ? n.textContent : ''}`.trim();
  });
  return { count: rows.length, first: rows.slice(0, 5), last: rows.slice(-3), dates: [...new Set([...d.querySelectorAll('#list .rdate span')].map((s) => s.textContent))] };
}

// ---------- cases ----------
const results = {};
pickPlace('pl', 'Chennai', 'India');
results['lagna-timings: Chennai 15 Jan 2026 from 00:00'] = await timings('2026-01-15', '00:00');
results['lagna-timings across midnight: Chennai 15 Jan 2026 from 22:00'] = await timings('2026-01-15', '22:00');
results['birth-chart: Chennai 15 Jun 1990 10:30'] = await birth({ date: '1990-06-15', time: '10:30:00', lat: '13.0827', lon: '80.2707', tz: 'Asia/Kolkata' });
results['edge: New York 14 Mar 2021 02:30 (clocks jump 02:00 to 03:00, this time does not exist)'] = await birth({ date: '2021-03-14', time: '02:30:00', lat: '40.7128', lon: '-74.006', tz: 'America/New_York' });
results['edge: New York 7 Nov 2021 01:30 (clocks fall back, this time happens twice)'] = await birth({ date: '2021-11-07', time: '01:30:00', lat: '40.7128', lon: '-74.006', tz: 'America/New_York' });
results['edge: Chennai 1 Sep 1942 12:00 (India war time, UTC+6:30)'] = await birth({ date: '1942-09-01', time: '12:00:00', lat: '13.0827', lon: '80.2707', tz: 'Asia/Kolkata' });

// ---------- compare ----------
const engineErrors = errors.filter((e) => !/scrollTo|getContext|Not implemented/.test(e));
if (UPDATE || !existsSync(SNAP)) {
  mkdirSync(dirname(SNAP), { recursive: true });
  writeFileSync(SNAP, JSON.stringify(results, null, 2) + '\n');
  console.log(`Saved ${Object.keys(results).length} reference results to tests/snapshots.json`);
} else {
  const want = JSON.parse(readFileSync(SNAP, 'utf8'));
  let failed = 0;
  for (const [name, got] of Object.entries(results)) {
    const ok = JSON.stringify(got) === JSON.stringify(want[name]);
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) {
      const a = JSON.stringify(want[name], null, 1).split('\n'), b = JSON.stringify(got, null, 1).split('\n');
      b.forEach((line, i) => { if (line !== a[i]) console.log(`      expected: ${a[i] ?? '(nothing)'}\n      got:      ${line}`); });
    }
  }
  console.log(failed ? `\n${failed} case(s) changed. If the change is intended (a new APK), run: npm test -- --update` : '\nAll cases match the saved results.');
  process.exitCode = failed ? 1 : 0;
}
// The edge cases are printed so a person can check them against a trusted ephemeris.
for (const k of Object.keys(results).filter((k) => k.startsWith('edge'))) console.log(`\n${k}\n  ${results[k].born}\n  ${results[k].planets.slice(0, 2).join('\n  ')}`);
if (engineErrors.length) { console.log('\nEngine errors:', engineErrors.slice(0, 5)); process.exitCode = 1; }
process.exit();
