#!/usr/bin/env node
// Accuracy test: the engine's own calculations against an independent ephemeris.
// tests/reference.json holds Swiss Ephemeris values for 12 charts (1950 to 2040, seven places) and four
// sunrise days (scripts/reference/make-reference.py writes it). This test loads the built engine headless
// (jsdom), asks it the same questions through window.GA_CORE (shared by a build patch) and fails when an
// answer is further off than the tolerance below. Run after every engine import: a release that changed
// an ayanamsa, a house formula or the astronomy library shows here at once.
//
//   npm run test:accuracy
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'public', 'index.html');
const REF = JSON.parse(readFileSync(join(ROOT, 'tests', 'reference.json'), 'utf8'));
// Tolerances in degrees (1′ = 0.0167°) and minutes of time. A KP sub-lord is at least 0.2° wide, so 1′
// moves a boundary by seconds of time, never a whole sub. A 6″ Moon difference moves a dasha start by a day.
const TOL = { planet: 1 / 60, moon: 1 / 60, node: 1 / 60, ayanamsa: 1 / 60, asc: 1 / 60, cusp: 2 / 60, sunMin: 1.5, dashaDays: 2 };

const vc = new VirtualConsole();
const errors = [];
vc.on('jsdomError', (e) => errors.push(String(e.message).split('\n')[0]));
const UI_SCRIPTS = /<script src="(revamp\/[^"]+|js\/(?:0[3-9]|[1-9][0-9])-[^"]+)"><\/script>\n?/g;
const html = readFileSync(PAGE, 'utf8').replace(UI_SCRIPTS, '').replace(/<link rel="stylesheet"[^>]*>\n?/g, '');
const dom = new JSDOM(html, {
  url: pathToFileURL(PAGE).href, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.Element.prototype.scrollTo = function () {}; w.Element.prototype.scrollIntoView = function () {}; w.scrollTo = function () {};
    w.requestIdleCallback = (fn) => setTimeout(fn, 1);
    w.fetch = () => Promise.reject(new w.TypeError('fetch is not available in the test'));
    const mem = new Map();
    Object.defineProperty(w, 'localStorage', { configurable: true, value: { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0 } });
  },
});
await new Promise((r) => dom.window.addEventListener('load', r));
const w = dom.window, C = w.GA_CORE, A = w.Astronomy;
if (!C) { console.error('FAIL  window.GA_CORE is missing: the build patch did not apply (npm run build)'); process.exit(1); }

const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const rows = []; let failures = 0;
function check(label, err, tol, unit = '°') {
  const ok = err <= tol;
  if (!ok) failures++;
  rows.push({ label, err, tol, unit, ok });
}
const fmt = (x, unit) => unit === '°' ? (x * 3600).toFixed(1) + '″' : x.toFixed(2) + ' ' + unit;

// Positions, ayanamsa, ascendant and cusps
const worst = {};
const note = (k, e, where) => { if (!worst[k] || e > worst[k].e) worst[k] = { e, where }; };
for (const c of REF.cases) {
  const jd = c.ms / 86400000 + 2440587.5, kp = C.ayanamsa(jd, 'kp');
  for (const code of ['Su', 'Mo', 'Ma', 'Me', 'Ju', 'Ve', 'Sa', 'Ra', 'Ke']) {
    // Sidereal + the engine's own ayanamsa = the engine's tropical longitude: this isolates the astronomy.
    const e = diff(C.lon(code, c.ms, 'kp') + kp, c.tropical[code]);
    note(code === 'Mo' ? 'moon' : code === 'Ra' || code === 'Ke' ? 'node' : 'planet', e, `${code} ${c.utc}`);
  }
  note('ayanamsa', Math.abs(kp - c.ayanamsa.kp), `KP ${c.utc}`);
  note('ayanamsa', Math.abs(C.ayanamsa(jd, 'lahiri') - c.ayanamsa.lahiri), `Lahiri ${c.utc}`);
  note('asc', diff(C.sidAsc(c.ms, c.lat, c.lon, 'kp') + kp, c.asc), `${c.place} ${c.utc}`);
  const cu = C.placidusCusps(c.ms, c.lat, c.lon, 'kp');
  cu.forEach((x, i) => note('cusp', diff(x + kp, c.cusps[i]), `cusp ${i + 1} ${c.place} ${c.utc}`));
  // Vimshottari: the dasha running at the moment, from the reference Moon (engine ayanamsa), by plain arithmetic.
  const moon = ((c.tropical.Mo - kp) % 360 + 360) % 360, N = 360 / 27, nak = Math.floor(moon / N);
  const lord = C.ORDER[nak % 9], elapsed = (moon % N) / N;
  const start = c.ms - elapsed * C.BP_YRS[lord] * 365.25 * 86400000;
  const d = C.bpDasha(C.lon('Mo', c.ms, 'kp'), c.ms);
  if (d.lord !== lord) { failures++; rows.push({ label: `dasha lord at ${c.utc}`, err: NaN, tol: 0, unit: d.lord + ' vs ' + lord, ok: false }); }
  note('dasha', Math.abs(d.list[0].s - start) / 86400000, `${c.utc}`);
}
check('Sun to Saturn (worst: ' + worst.planet.where + ')', worst.planet.e, TOL.planet);
check('Moon (worst: ' + worst.moon.where + ')', worst.moon.e, TOL.moon);
check('Rahu and Ketu, mean node (' + worst.node.where + ')', worst.node.e, TOL.node);
check('Ayanamsa, KP and Lahiri (' + worst.ayanamsa.where + ')', worst.ayanamsa.e, TOL.ayanamsa);
check('Ascendant (' + worst.asc.where + ')', worst.asc.e, TOL.asc);
check('Placidus cusps (' + worst.cusp.where + ')', worst.cusp.e, TOL.cusp);
check('Vimshottari dasha start (' + worst.dasha.where + ')', worst.dasha.e, TOL.dashaDays, 'days');

// Sunrise and sunset, the way the engine finds them (Rahu kalam) and the new Gowri tool does.
let sunWorst = { e: 0, where: '' };
for (const s of REF.sun) {
  const obs = new A.Observer(s.lat, s.lon, 0);
  const r = A.SearchRiseSet(A.Body.Sun, obs, +1, A.MakeTime(new w.Date(s.from)), 2);
  const t = A.SearchRiseSet(A.Body.Sun, obs, -1, r, 2);
  for (const [k, got, want] of [['rise', r.date.getTime(), s.rise], ['set', t.date.getTime(), s.set]]) {
    const e = Math.abs(got - want) / 60000;
    if (e > sunWorst.e) sunWorst = { e, where: `${k} ${s.place} ${s.day}` };
  }
}
check('Sunrise and sunset (' + sunWorst.where + ')', sunWorst.e, TOL.sunMin, 'min');

console.log(`Engine against ${REF.source}: ${REF.cases.length} charts, ${REF.sun.length} sunrise days\n`);
for (const r of rows) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.label}: ${Number.isNaN(r.err) ? r.unit : fmt(r.err, r.unit) + ' (allowed ' + fmt(r.tol, r.unit) + ')'}`);
if (errors.length) console.log('\nscript errors:', errors.slice(0, 3));
console.log(failures ? `\n${failures} check(s) outside tolerance.` : '\nAll calculations agree with the reference.');
process.exit(failures ? 1 : 0);
