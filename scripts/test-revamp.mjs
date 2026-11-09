#!/usr/bin/env node
// Behaviour tests for the revamp layer (revamp/*.js) on top of the engine.
// Loads public/index.html headless (jsdom) with the revamp scripts in place and checks what they add:
// saved people filling a tool's birth form, long result lists folding to a first page, the folded place
// line falling back to the search text when the city list has no match, and the example card that
// follows an Ask GuruAgasthiya reply no rule matched.
//
//   npm run test:revamp
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'public', 'index.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const started = Date.now();

// ---------- load the app ----------
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push(String(e.message).split('\n')[0]));
// Keep the engine (blocks 01, 02) and every revamp script. Leave out the original layout helpers from
// block 03 on: 10.5's block 08 relabels form controls on every DOM change and never finishes under jsdom.
const LAYOUT_SCRIPTS = /<script src="js\/(?:0[3-9]|[1-9][0-9])-[^"]+"><\/script>\n?/g;
const html = readFileSync(PAGE, 'utf8').replace(LAYOUT_SCRIPTS, '').replace(/<link rel="stylesheet"[^>]*>\n?/g, ''); // no layout, no styles
const PERSON = { name: 'Meena', date: '1990-06-15', time: '10:30:00', lat: '13.0827', lon: '80.2707', tz: 'Asia/Kolkata', place: 'Chennai, Tamil Nadu, India' };
const HOME = { name: 'Madurai', st: 'Tamil Nadu', cc: 'India', lat: 9.919, lon: 78.12, tz: 'Asia/Kolkata', src: 'manual' };
const RECENT = { name: 'Chennai', st: 'Tamil Nadu', cc: 'India', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' };
const dom = new JSDOM(html, {
  url: pathToFileURL(PAGE).href, runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    // Browser features jsdom does not have.
    w.matchMedia = w.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    w.Element.prototype.scrollTo = function () {}; w.Element.prototype.scrollIntoView = function () {}; w.scrollTo = function () {};
    w.requestIdleCallback = (fn) => setTimeout(fn, 1);
    // No network: the engine's online place search gets a failed request instead of a missing function.
    w.fetch = () => Promise.reject(new w.TypeError('fetch is not available in the test'));
    // jsdom refuses pushState/replaceState on a file: page; the revamp's routes write #/<tool> through them.
    const setHash = (state, title, url) => { if (typeof url === 'string' && url.startsWith('#')) w.location.hash = url; };
    w.History.prototype.pushState = setHash; w.History.prototype.replaceState = setHash;
    w.HTMLDialogElement && (w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); }, w.HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); });
    // file: pages have no localStorage in jsdom; give the app a fresh in-memory one.
    const mem = new Map();
    const ls = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k), clear: () => mem.clear(), key: (i) => [...mem.keys()][i] ?? null, get length() { return mem.size; } };
    Object.defineProperty(w, 'localStorage', { value: ls, configurable: true });
    ls.setItem('rvSetup', '1'); // no first-run dialog
    ls.setItem('gaBirthList', JSON.stringify([PERSON])); // one saved person, as Birth Chart would save it
    ls.setItem('ga_place', JSON.stringify(HOME)); ls.setItem('ga_place_recent', JSON.stringify([HOME, RECENT])); // the shared place and its history
  },
});
await new Promise((r) => dom.window.addEventListener('load', r));
await sleep(300);
const w = dom.window, d = w.document, $ = (id) => d.getElementById(id);
const fire = (el, t) => el.dispatchEvent(new w.Event(t, { bubbles: true }));
// The revamp's page watcher runs its hooks 150 ms after the last DOM change.
const settle = () => sleep(400);

// ---------- checks ----------
let failed = 0, passed = 0;
function check(name, fn) {
  try {
    const why = fn();
    if (why) { failed++; console.log(`FAIL  ${name}\n      ${why}`); } else { passed++; console.log(`PASS  ${name}`); }
  } catch (e) { failed++; console.log(`FAIL  ${name}\n      ${String(e.message || e).split('\n')[0]}`); }
}
const eq = (what, got, want) => (got === want ? '' : `${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
const shownRows = (out) => [...out.querySelectorAll('li.row')].filter((li) => !li.classList.contains('rv-hide-more')).length;

// (1) Saved people fill Natal Chart Trade's birth form.
// The engine shows its disclaimer before the first tool; accepting it opens the tool and the revamp
// remembers the acceptance for the day (localStorage rvDiscDay).
$('ntBtn').click(); await settle();
// The sidebar buttons have no English title here (the engine sets titles in a layout script, left out
// above), the same situation as a start-up with Tamil stored, where the titles are already Tamil.
check('routes: tool addresses are fixed per tool, not read from the button titles', () =>
  eq('ntBtn', $('ntBtn').dataset.route, 'natal-chart-trade') || eq('eqBtn', $('eqBtn').dataset.route, 'mundane-astrology') ||
  eq('m3Btn', $('m3Btn').dataset.route, '3-11-muhurtham') || eq('homeBtn', $('homeBtn').dataset.route, 'lagna-timings'));

check('disclaimer: the first tool click shows the disclaimer, OK opens the tool', () => {
  const disc = $('gaDisc');
  if (!disc || disc.classList.contains('hide')) return 'gaDisc not showing after the tool click';
  $('gaDiscOk').click();
  return eq('gaDisc hidden after OK', disc.classList.contains('hide'), true) || eq('rvDiscDay saved', !!w.localStorage.getItem('rvDiscDay'), true);
});
await sleep(1200); // the engine's shared place settles 500 ms after load; the revamp follows 200 ms later
check('shared place: Natal Chart Trade opens on the home place, named, with its recent places', () => {
  const panel = $('ntPanel'), line = panel.querySelector('.rv-place-t b'), recent = panel.querySelector('select.plrecent');
  if (!recent) return 'no Recent places select in ntPanel';
  const names = [...recent.options].map((o) => o.text);
  return eq('#ntSearch', $('ntSearch').value, HOME.name) || eq('#ntLat', $('ntLat').value, String(HOME.lat)) || eq('#ntLon', $('ntLon').value, String(HOME.lon)) ||
    eq('#ntTz', $('ntTz').value, HOME.tz) || eq('place line', line.textContent.trim(), 'Madurai, Tamil Nadu, India') ||
    (names.includes('Chennai, Tamil Nadu, India') ? '' : `Chennai missing from recent places: ${JSON.stringify(names)}`) ||
    eq('recent select on the home place', recent.options[recent.selectedIndex]?.text, 'Madurai, Tamil Nadu, India');
});
check('saved people: Natal Chart Trade opens with a people list', () => {
  const panel = $('ntPanel'), sel = panel.querySelector('.rv-people select');
  if (panel.classList.contains('hide')) return 'ntPanel still hidden';
  if (!sel) return 'no .rv-people select in ntPanel';
  if (sel.disabled) return 'people select is disabled';
  const names = [...sel.options].map((o) => o.text);
  if (!names.some((t) => t.startsWith('Meena'))) return `person not listed, options: ${JSON.stringify(names)}`;
});
{
  const sel = $('ntPanel').querySelector('.rv-people select');
  const i = [...sel.options].findIndex((o) => o.text.startsWith('Meena'));
  sel.selectedIndex = i; fire(sel, 'change'); await settle();
}
check('saved people: choosing the person fills name, date, time and coordinates', () =>
  eq('#ntName', $('ntName').value, PERSON.name) || eq('#ntDob', $('ntDob').value, PERSON.date) || eq('#ntTob', $('ntTob').value, PERSON.time) ||
  eq('#ntLat', $('ntLat').value, PERSON.lat) || eq('#ntLon', $('ntLon').value, PERSON.lon) || eq('#ntTz', $('ntTz').value, PERSON.tz));
check('saved people: the folded place line names the saved place', () => {
  const b = $('ntPanel').querySelector('.rv-place-t b');
  if (!b) return 'no .rv-place-t b in ntPanel';
  return eq('place line', b.textContent.trim(), PERSON.place);
});

// (2) Long result lists fold to a first page.
const out = $('gamOut');
const rowsHtml = (n, from = 1) => Array.from({ length: n }, (_, i) => `<li class="row"><span class="t"><b>Row ${from + i}</b></span></li>`).join('');
const twoLists = (n) => `<h4>Day 1</h4><ul>${rowsHtml(n / 2)}</ul><h4>Day 2</h4><ul>${rowsHtml(n / 2, n / 2 + 1)}</ul>`;
out.innerHTML = twoLists(120); await settle();
check('list folding: 120 rows fold to 60 with a "Showing 60 of 120" bar', () => {
  const bar = out.querySelector(':scope > .rv-more-bar');
  if (!bar) return 'no .rv-more-bar in #gamOut';
  const note = bar.querySelector('.rv-more-note');
  return eq('visible rows', shownRows(out), 60) || eq('note', note && note.textContent.trim(), 'Showing 60 of 120') ||
    eq('second list hidden', out.querySelectorAll('ul')[1].classList.contains('rv-hide-more'), true) || eq('bar hidden', bar.classList.contains('hide'), false);
});
check('list folding: the first button shows the rest', () => {
  const bar = out.querySelector(':scope > .rv-more-bar');
  bar.querySelector('button').click();
  return eq('visible rows after click', shownRows(out), 120) || eq('note', bar.querySelector('.rv-more-note').textContent.trim(), 'Showing 120 of 120') ||
    eq('second list shown', out.querySelectorAll('ul')[1].classList.contains('rv-hide-more'), false) || eq('bar hidden', bar.classList.contains('hide'), true);
});
out.innerHTML = twoLists(120); await settle();
check('list folding: a re-run with 120 rows folds again', () => {
  const bar = out.querySelector(':scope > .rv-more-bar');
  if (!bar) return 'no .rv-more-bar after re-render';
  return eq('visible rows', shownRows(out), 60) || eq('note', bar.querySelector('.rv-more-note').textContent.trim(), 'Showing 60 of 120');
});
out.innerHTML = `<ul>${rowsHtml(40)}</ul>`; await settle();
check('list folding: 40 rows get no bar', () =>
  eq('bar present', !!out.querySelector(':scope > .rv-more-bar'), false) || eq('visible rows', shownRows(out), 40));
out.innerHTML = '';

// (3) The place line falls back to the search text when the city list has no match.
const ADVICE = 'No match in the offline list. Type the latitude and longitude below, or search online.';
$('ntCity').innerHTML = `<option value="">${ADVICE}</option>`; $('ntCity').selectedIndex = 0;
$('ntSearch').value = 'Chennai, India'; fire($('ntSearch'), 'change'); await sleep(50);
check('place picker: a no-match city list shows the search text, not the advice', () => {
  const b = $('ntPanel').querySelector('.rv-place-t b').textContent.trim();
  if (/no match|type the latitude|search online/i.test(b)) return `advice shown as the place: ${JSON.stringify(b)}`;
  return eq('place line', b, 'Chennai, India');
});
$('ntSearch').value = ''; fire($('ntSearch'), 'change'); await sleep(50);
check('place picker: with no search text and coordinates set, it says "Place by coordinates"', () =>
  eq('place line', $('ntPanel').querySelector('.rv-place-t b').textContent.trim(), 'Place by coordinates'));

// (4) Ask GuruAgasthiya: a reply the engine could not match gets a card with example questions.
// The reply nodes are appended by hand, exactly as the engine's add() writes them, so the check does not
// depend on which question the engine's rules fail to match.
const akLog = $('akLog');
const akBubble = (cls, text) => { const n = d.createElement('div'); n.className = 'ak-m ' + cls; n.innerHTML = `<p>${text}</p>`; n.setAttribute('lang', cls === 'ak-b' ? 'en' : 'en'); akLog.appendChild(n); return n; };
akBubble('ak-u', 'my laptop was stolen yesterday');
const noMatchEn = akBubble('ak-b', 'I could not match that to one question. Try a form like these:'); await sleep(50);
check('ask fallback: an unmatched English reply gets a card with the closest category and example chips', () => {
  const card = noMatchEn.nextElementSibling;
  if (!card || !card.classList.contains('rv-ak-help')) return 'no .rv-ak-help card after the reply';
  const heads = [...card.querySelectorAll('.rv-ak-h')].map((p) => p.textContent.trim());
  const chips = [...card.querySelectorAll('.ak-chip')];
  if (!chips.length) return 'no example chips in the card';
  return eq('headings', heads.join(' | '), 'Closest to your question: | You can ask me about…') ||
    eq('first chip', chips[0].textContent.trim(), 'Lost itemsWill I find my lost item?') ||
    eq('every category once', chips.length, 11) || eq('card language', card.getAttribute('lang'), 'en');
});
check('ask fallback: tapping an example sends it like typing and pressing Send', () => {
  const chip = noMatchEn.nextElementSibling.querySelector('.ak-chip');
  const before = akLog.children.length;
  chip.click();
  const added = [...akLog.children].slice(before);
  const user = added.find((n) => n.classList.contains('ak-u'));
  if (!user) return `no user bubble appended, ${added.length} node(s) added`;
  return eq('sent text', user.textContent.trim(), 'Will I find my lost item?') || eq('composer cleared', $('akText').value, '') ||
    (added.some((n) => n.classList.contains('ak-b')) ? '' : 'the engine gave no reply to the example');
});
d.body.setAttribute('data-lang', 'ta'); await sleep(100);
akBubble('ak-u', 'என் லேப்டாப் நேற்று திருடு போனது');
const noMatchTa = akBubble('ak-b', 'அந்தக் கேள்வியை ஒன்றாகப் பொருத்த இயலவில்லை. இது போன்ற வடிவில் கேளுங்கள்:'); await sleep(50);
check('ask fallback: an unmatched Tamil reply gets the card in Tamil', () => {
  const card = noMatchTa.nextElementSibling;
  if (!card || !card.classList.contains('rv-ak-help')) return 'no .rv-ak-help card after the Tamil reply';
  const heads = [...card.querySelectorAll('.rv-ak-h')].map((p) => p.textContent.trim());
  const chips = [...card.querySelectorAll('.ak-chip')];
  if (!chips.length) return 'no example chips in the card';
  const english = chips.map((c) => c.textContent).filter((t) => /[A-Za-z]/.test(t));
  return eq('headings', heads.join(' | '), 'உங்கள் கேள்விக்கு நெருக்கமானவை: | நீங்கள் என்னிடம் கேட்கலாம்…') ||
    (english.length ? `chips left in English: ${JSON.stringify(english.slice(0, 3))}` : '') ||
    eq('first chip', chips[0].textContent.trim(), 'தொலைந்த பொருள்தொலைந்த பொருள் கிடைக்குமா?');
});
d.body.setAttribute('data-lang', 'bi'); await sleep(100);

// (5) What's new: the revamp's own page, at #/whats-new, listed beside About and linked from it.
check('whats-new: the sidebar entry sits next to About with data-route="whats-new"', () => {
  const b = $('rvNewBtn');
  if (!b) return 'no #rvNewBtn in the sidebar';
  return eq('data-route', b.dataset.route, 'whats-new') || eq('in the last group', b.closest('.rv-group')?.dataset.g, 'more') ||
    eq('right after About', b.previousElementSibling?.id, 'abBtn') || eq('own hue', /^\d+$/.test(b.style.getPropertyValue('--ich').trim()), true);
});
w.location.hash = '#/whats-new'; await settle();
check('whats-new: #/whats-new shows the panel, highlights the entry and names the page', () => {
  const p = $('rvNewPanel');
  if (!p) return 'no #rvNewPanel';
  return eq('panel hidden', p.classList.contains('hide'), false) || eq('address', w.location.hash, '#/whats-new') ||
    eq('sidebar highlight', d.querySelector('.rv-groups .tool.rv-on')?.id, 'rvNewBtn') || eq('title', d.title, "What's new · GuruAgasthiya") ||
    eq('sections', [...p.querySelectorAll('h3')].map((h) => h.textContent).join(' | '), 'New in the engine 10.5 | New on the web') ||
    eq('items', p.querySelectorAll('li').length, 11) || eq('tool links', p.querySelectorAll('a[href^="#/"]').length >= 7, true);
});
check('whats-new: About links to it from the top', () => {
  const a = d.querySelector('#abPanel > .sh-head + .rv-new-link a');
  return a ? eq('href', a.getAttribute('href'), '#/whats-new') : 'no .rv-new-link right after the About header';
});
d.body.setAttribute('data-lang', 'ta'); await sleep(200);
check('whats-new: in Tamil, the headings and every paragraph are translated', () => {
  const p = $('rvNewPanel');
  const paras = [...p.querySelectorAll('p.rv-new-intro, li')];
  const missing = paras.filter((el) => !el.querySelector(':scope > .rv-ta-para')).map((el) => el.textContent.trim().slice(0, 40));
  return eq('heading', p.querySelector('h2').textContent.trim(), 'புதியவை') || eq('sections', [...p.querySelectorAll('h3')].map((h) => h.textContent).join(' | '), 'இயந்திரம் 10.5-இல் புதியவை | இணையப் பதிப்பில் புதியவை') ||
    eq('sidebar label', $('rvNewBtn').querySelector('.tx').firstChild.textContent.trim(), 'புதியவை') ||
    (missing.length ? `paragraphs without Tamil: ${JSON.stringify(missing)}` : '') ||
    eq('links kept', p.querySelectorAll('.rv-ta-para a[href^="#/"]').length >= 7, true);
});
d.body.setAttribute('data-lang', 'bi'); await sleep(200);
check('whats-new: back in bilingual mode the English is back and ✕ returns to the page underneath', () => {
  const p = $('rvNewPanel');
  if (p.querySelector('.rv-ta-para')) return 'Tamil paragraphs still in place';
  if (p.querySelector('h2').textContent.trim() !== "What's new") return `heading is ${JSON.stringify(p.querySelector('h2').textContent)}`;
  $('rvNewClose').click();
  return eq('panel hidden', p.classList.contains('hide'), true);
});
await settle();
check('whats-new: after ✕ the address is the base page again', () => (/^#\/(now|lagna-timings)$/.test(w.location.hash) ? '' : `address is ${w.location.hash}`));

// ---------- result ----------
const scriptErrors = errors.filter((e) => !/scrollTo|getContext|Not implemented/.test(e));
if (scriptErrors.length) { failed++; console.log(`FAIL  no script errors\n      ${scriptErrors.slice(0, 5).join('\n      ')}`); } else { passed++; console.log('PASS  no script errors'); }
console.log(`\n${failed ? `${failed} check(s) failed, ${passed} passed` : `All ${passed} checks passed`} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
process.exitCode = failed ? 1 : 0;
process.exit();
