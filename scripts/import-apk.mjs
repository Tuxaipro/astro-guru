#!/usr/bin/env node
// Rebuilds public/ from a GuruAgasthiya release: the APK, or the single HTML page it wraps.
//
// The Android app is a thin WebView shell around one self-contained
// assets/index.html; newer releases also come as that page on its own (GuruAgasthiya-x.y.html). Its code already runs in a plain browser (it detects
// window.GuruApp and falls back to web APIs), so this script only splits that
// single file into cacheable pieces:
//   - every <style> / <script> block  -> css/*.css, js/*.js (same order)
//   - embedded @font-face fonts       -> fonts/*
//   - embedded images                 -> img/*
//   - cityData / landData JSON blocks -> data/*.js (window.GA_CITY / GA_LAND)
//   - the gaNamesData text block      -> names.txt (the engine fetches /names.txt when the block is absent)
// It is a plain website: no web app manifest, no service worker, nothing to install.
//
// Usage: node scripts/import-apk.mjs [path/to/GuruAgasthiya-x.y.apk | path/to/GuruAgasthiya-x.y.html]

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- Engine patches ----------
// The engine (02-app.js) is replaced on every import, so it is never edited by hand. These small, named
// changes are applied to each release instead. Each one must match the engine text exactly the expected
// number of times; if a release moves that code, the build stops and names the patch, instead of
// shipping a silently different engine. Keep them few, and say why each exists.
const ENGINE_PATCHES = [
  {
    name: 'sub-lord list: a helper named like the sign helper it calls',
    why: 'subList() defined a local sg() that called sg() for the sign name, i.e. itself, so "lagna timings today" in Ask GuruAgasthiya ended in "Maximum call stack size exceeded".',
    edits: [
      ['const sg=k=>{ const g=SEGS[k]; return {sg:sg(g.sign),', 'const sgRow=k=>{ const g=SEGS[k]; return {sg:sg(g.sign),', 1],
      ['.map(x=>{ const q=sg(x.k);', '.map(x=>{ const q=sgRow(x.k);', 2],
    ],
  },
  {
    name: 'GA_CORE: share the calculation core',
    why: 'The engine keeps its astronomy inside one closure. The revamp tools (matching, Gowri, transits, rectification, dasha timeline) and the accuracy test use the same functions instead of copies.',
    edits: [[/\}\)\(\);\s*$/, `
/* revamp build patch: the calculation core, shared read-only */
window.GA_CORE=Object.freeze({
  ORDER:ORDER,NAME:NAME,TA:TA,YEARS:YEARS,SIGNS:SIGNS,NAKS:NAKS,TSIGN:TSIGN,CODES:CODES,SEGS:SEGS,BP_YRS:BP_YRS,BP_YEAR:BP_YEAR,
  findSeg:findSeg,ayanamsa:ayanamsa,sidAsc:sidAsc,placidusCusps:placidusCusps,bpDasha:bpDasha,bpNavamsa:bpNavamsa,localToUtc:localToUtc,offsetAt:offsetAt,
  lon:function(code,ms,kind){const o=CFG;CFG=Object.assign({},o,{kind:kind||o.kind});try{return sidLon(code,ms);}finally{CFG=o;}},
  planets:function(ms,kind){const o=CFG;CFG=Object.assign({},o,{kind:kind||o.kind});try{return planets(ms);}finally{CFG=o;}},
  retro:function(code,ms){return isRetro(code,ms);}
});
})();
`, 1]],
  },
];
function patchEngine(body) {
  for (const p of ENGINE_PATCHES) {
    for (const [find, repl, want] of p.edits) {
      const n = typeof find === 'string' ? body.split(find).length - 1 : (body.match(new RegExp(find.source, 'g' + find.flags.replace('g', ''))) || []).length;
      if (n !== want) throw new Error(`Engine patch "${p.name}" expected ${want} match(es) of ${String(find).slice(0, 60)}, found ${n}. The engine changed here: check the patch (${p.why})`);
      body = typeof find === 'string' ? body.split(find).join(repl) : body.replace(find, repl);
    }
  }
  console.log(`Engine patches applied: ${ENGINE_PATCHES.map((p) => p.name.split(':')[0]).join(', ')}`);
  return body;
}
const OUT = join(ROOT, 'public');
const src = resolve(process.argv[2] || join(ROOT, '..', 'GuruAgasthiya-12.3.html'));

const html = /\.html?$/i.test(src) ? readFileSync(src, 'utf8')
  : execFileSync('unzip', ['-p', src, 'assets/index.html'], { maxBuffer: 64 << 20 }).toString('utf8');
if (!html.includes('<html')) throw new Error('no GuruAgasthiya page in ' + src);

rmSync(OUT, { recursive: true, force: true });
for (const d of ['css', 'js', 'fonts', 'img', 'data', 'icons']) mkdirSync(join(OUT, d), { recursive: true });

const write = (rel, data) => { writeFileSync(join(OUT, rel), data); return rel; };
const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 10);
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg',
  'font/woff2': 'woff2', 'font/woff': 'woff', 'application/font-woff': 'woff', 'font/ttf': 'ttf' };

// ---- data URIs -> files (deduplicated by content) ----
const seen = new Map();
function extract(mime, b64, dir, base) {
  const buf = Buffer.from(b64, 'base64');
  const key = sha(buf);
  if (!seen.has(key)) seen.set(key, write(`${dir}/${base}-${key}.${EXT[mime] || 'bin'}`, buf));
  return seen.get(key);
}

const version = (html.match(/<title>[^<]*?([\d.]+)\s*<\/title>/) || [])[1] || '0';
let cssN = 0, jsN = 0;
const imgs = [];

let out = html.replace(/<(style|script)([^>]*)>([\s\S]*?)<\/\1>/g, (all, tag, attrs, body) => {
  const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
  if (tag === 'style') {
    if (id === 'ga-fonts') {
      // Font file names follow family + weight + style for readability.
      body = body.replace(/@font-face\s*{([^}]*)}/g, (face, decl) => {
        const fam = ((decl.match(/font-family:\s*['"]?([^;'"]+)/) || [])[1] || 'font').trim().replace(/\s+/g, '');
        const wt = (decl.match(/font-weight:\s*([^;]+)/) || [])[1] || '';
        const st = (decl.match(/font-style:\s*([^;]+)/) || [])[1] || '';
        return face.replace(/url\(\s*['"]?data:([^;]+);base64,([A-Za-z0-9+/=]+)['"]?\s*\)/g,
          (_, mime, b64) => `url(../${extract(mime, b64, 'fonts', `${fam}-${wt}${st === 'normal' ? '' : st}`.replace(/[^\w-]/g, ''))})`);
      });
      return `<link rel="stylesheet" href="${write('css/fonts.css', body)}">`;
    }
    body = body.replace(/url\(\s*['"]?data:([^;]+);base64,([A-Za-z0-9+/=]+)['"]?\s*\)/g,
      (_, mime, b64) => `url(../${mime.includes('font') ? extract(mime, b64, 'fonts', 'font') : extract(mime, b64, 'img', 'bg')})`);
    const name = `css/${String(++cssN).padStart(2, '0')}-${slug(body, 'style')}.css`;
    // With the revamp layer, the engine's styles sit in a lower cascade layer: any revamp rule then wins
    // over any engine rule, without specificity contests or !important.
    const layered = existsSync(join(ROOT, 'revamp', 'revamp.css')) ? `@layer engine {\n${body}\n}\n` : body;
    return `<link rel="stylesheet" href="${write(name, layered)}">`;
  }
  // scripts
  if (/text\/plain/.test(attrs)) {
    // Data the engine reads as text. The names list (1.8 MB) becomes a file it fetches only when needed;
    // anything else stays inline, so it is never run as a script.
    if (id === 'gaNamesData') { write('names.txt', body); return ''; }
    return all;
  }
  if (/application\/json/.test(attrs)) {
    const glob = id === 'cityData' ? 'GA_CITY' : id === 'landData' ? 'GA_LAND' : null;
    if (!glob) return all; // unknown JSON block: keep inline
    const data = JSON.parse(body); // validate
    const file = id === 'cityData' ? 'data/cities.js' : 'data/land.js';
    // Written as JSON.parse('…') rather than an object literal: browsers read a large JSON string much
    // faster than the same data as script (the 9.5 MB city list: about 0.7 s sooner on a phone).
    const quoted = JSON.stringify(data).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    write(file, `window.${glob}=JSON.parse('${quoted}');\n`);
    // The map outline is only needed by Astrocartography; with the revamp layer it loads after the page.
    if (id === 'landData' && existsSync(join(ROOT, 'revamp', 'features.js'))) return '';
    return `<script src="${file}"></script>`;
  }
  if (/\bsrc=/.test(attrs)) return all;
  // 11.x opens with an error reporter for the Android build. It is kept, unnumbered, so the engine's own
  // scripts keep their file names (01-astronomy-engine.js, 02-app.js, …).
  if (/getElementById\('gaDiag'\)/.test(body.slice(0, 400))) return `<script src="${write('js/00-diagnostics.js', body)}"></script>`;
  body = body
    .replace(/JSON\.parse\(\$\('cityData'\)\.textContent\)/g, 'window.GA_CITY')
    .replace(/JSON\.parse\(\$\('landData'\)\.textContent\)/g, 'window.GA_LAND');
  const label = /Astronomy library for JavaScript/.test(body) ? 'astronomy-engine'
    : slug(body, '') || (/const ORDER=\[/.test(body.slice(0, 400)) ? 'app'
    : /getElementById\('stage'\)/.test(body.slice(0, 400)) ? 'stage-layout' : 'script');
  if (label === 'app' && existsSync(join(ROOT, 'revamp', 'revamp.js'))) body = patchEngine(body);
  const name = `js/${String(++jsN).padStart(2, '0')}-${label}.js`;
  return `<script src="${write(name, body)}"></script>`;
});

// images referenced from markup
out = out.replace(/(<img\b[^>]*?\balt="([^"]*)"[^>]*?\bsrc=")data:([^;]+);base64,([A-Za-z0-9+/=]+)"/g,
  (_, pre, alt, mime, b64) => `${pre}${extract(mime, b64, 'img', slugText(alt) || 'img')}"`);
out = out.replace(/(<link\b[^>]*rel="(icon|apple-touch-icon)"[^>]*href=")data:([^;]+);base64,([A-Za-z0-9+/=]+)"/g,
  (_, pre, rel, mime, b64) => { const f = extract(mime, b64, 'icons', rel); imgs.push({ rel, f }); return `${pre}${f}"`; });
out = out.replace(/(src|href)="data:([^;]+);base64,([A-Za-z0-9+/=]+)"/g,
  (_, a, mime, b64) => `${a}="${extract(mime, b64, 'img', 'img')}"`);

if (out.includes(';base64,')) console.warn('warning: some data URIs were left inline');
if (/\$\('(cityData|landData)'\)/.test(out)) console.warn('warning: code still reads cityData/landData from the DOM');

// Start-up: the engine's page would paint in its original layout while the scripts load (the city list
// alone is several MB), and the revamp would then rearrange it. Keep the page behind a start-up screen in
// the chosen theme until the revamp has laid it out; revamp.js removes rv-boot.
// The screen shows the logo, the name and a moving bar. The bar moves by transform, which the browser
// animates off the main thread, so it keeps moving while the scripts block the page. On a first visit
// (nothing stored yet) a line says that the next visit is quicker. The Tamil half of that line is CSS
// text, so the engine's Tamil wrapper and the translator never touch it.
if (existsSync(join(ROOT, 'revamp', 'revamp.js'))) {
  const logo = (out.match(/<img\b[^>]*\bclass="logo"[^>]*\bsrc="([^"]+)"/) || [])[1];
  const boot = `<script>(function(){var d=document.documentElement;d.classList.add('rv-boot');` +
    `try{var a=localStorage.getItem('rvAppear');if(a)d.setAttribute('data-theme',a);if(!localStorage.getItem('rvBooted'))d.classList.add('rv-first');}catch(e){}` +
    `addEventListener('load',function(){try{localStorage.setItem('rvBooted','1');}catch(e){}` +
    `setTimeout(function(){d.classList.remove('rv-boot');},1500);});})();</script>\n` +
    `<style>@layer rvfix, engine;` +
    `html.rv-boot{background:#F4F5F9;--bt-fg:#1C1E2E;--bt-mute:#6E7290;--bt-track:rgba(110,114,144,.18)}` +
    `html.rv-boot[data-theme=dark]{background:#0D1020;--bt-fg:#E9EAF4;--bt-mute:#9295B3;--bt-track:rgba(146,149,179,.2)}` +
    `@media (prefers-color-scheme:dark){html.rv-boot:not([data-theme=light]){background:#0D1020;--bt-fg:#E9EAF4;--bt-mute:#9295B3;--bt-track:rgba(146,149,179,.2)}}` +
    `html.rv-boot body{background:transparent!important}html.rv-boot body>:not(#rvBoot){visibility:hidden!important}` +
    `#rvBoot{display:none}` +
    `html.rv-boot #rvBoot{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;` +
    `gap:14px;margin:0;padding:24px;font:400 14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--bt-mute);text-align:center}` +
    `#rvBoot img{display:block;width:64px;height:64px;border-radius:18px;object-fit:cover;margin:0 0 2px;box-shadow:0 6px 20px rgba(13,16,32,.18)}` +
    `#rvBoot b{display:block;font:650 21px/1.1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:-.015em;color:var(--bt-fg)}` +
    `#rvBoot i{display:block;position:relative;width:132px;height:3px;border-radius:3px;overflow:hidden;background:var(--bt-track);` +
    `animation:rvBootIn .35s .4s both}` +
    `#rvBoot i::after{content:"";position:absolute;top:0;left:0;width:40%;height:100%;border-radius:3px;background:#E9A92C;` +
    `transform:translateX(-100%);animation:rvBootBar 1.15s cubic-bezier(.45,0,.4,1) infinite;will-change:transform}` +
    `#rvBoot p{display:none;max-width:280px;margin:4px 0 0;animation:rvBootIn .35s .6s both}` +
    `html.rv-first #rvBoot p{display:block}` +
    `#rvBoot p::after{content:"முதல் முறை மட்டும் சற்று நேரம் ஆகும்";display:block;margin-top:2px;font-size:13px}` +
    `@keyframes rvBootBar{to{transform:translateX(250%)}}@keyframes rvBootIn{from{opacity:0}to{opacity:1}}` +
    `@media (prefers-reduced-motion:reduce){#rvBoot i::after{animation:none;transform:none;width:100%;opacity:.5}}</style>\n`;
  out = out.replace(/(<meta name="viewport"[^>]*>\n?)/, `$1${boot}`);
  const screen = `<div id="rvBoot" role="status">` + (logo ? `<img src="${logo}" alt="" width="64" height="64">` : '') +
    `<b>GuruAgasthiya</b><i></i><p>First visit: getting 225,000 places ready. Next time opens faster.</p></div>\n`;
  out = out.replace(/(<body\b[^>]*>\n?)/, `$1${screen}`);
}
// Link previews and search listings: a description, and Open Graph tags for WhatsApp, Facebook, X and
// others. A preview image needs the site's full address: set SITE_URL when building
// (SITE_URL=https://your.site npm run build) to add og:url and og:image; without it the text still shows.
if (existsSync(join(ROOT, 'revamp', 'revamp.js'))) {
  const site = (process.env.SITE_URL || '').replace(/\/+$/, '');
  const logo = (out.match(/<img\b[^>]*\bclass="logo"[^>]*\bsrc="([^"]+)"/) || [])[1];
  const desc = 'KP astrology in your browser: lagna and sub-lord timings for any day and place, muhurthams, birth chart and dasha, ' +
    'marriage matching, Gowri nalla neram, Sade Sati and transits, horary answers and more. English and Tamil. Calculated on your device.';
  const tags = [
    `<meta name="description" content="${desc}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="GuruAgasthiya">',
    `<meta property="og:title" content="GuruAgasthiya · KP astrology timings, muhurtham and charts">`,
    `<meta property="og:description" content="${desc}">`,
    site ? `<meta property="og:url" content="${site}/">` : '',
    site && logo ? `<meta property="og:image" content="${site}/${logo.replace(/\?.*$/, '')}">` : '',
    `<meta name="twitter:card" content="summary">`,
  ].filter(Boolean).join('\n');
  out = out.replace(/(<title>[^<]*<\/title>\n?)/, `$1${tags}\n`);
}
// The APK's page asks iOS to open a home-screen bookmark full screen. This is a plain website now, and
// Chrome warns about the old tag name, so drop it (the home-screen title tag is harmless and stays).
out = out.replace(/<meta name="apple-mobile-web-app-capable"[^>]*>\n?/, '');
// Earlier builds installed a service worker that keeps serving its stored copy of the app. Remove it,
// and its store, from any browser that still has it.
out = out.replace('</head>', `<script>if('serviceWorker'in navigator){navigator.serviceWorker.getRegistrations().then(function(a){a.forEach(function(r){r.unregister();});});` +
  `if(window.caches)caches.keys().then(function(a){a.forEach(function(k){caches.delete(k);});});}</script>\n</head>`);

// ---- Revamp layer (revamp/ at the project root): new shell and design over the unchanged engine ----
const REVAMP = join(ROOT, 'revamp');
let revampTags = { css: '', js: '' };
if (existsSync(REVAMP)) {
  cpSync(REVAMP, join(OUT, 'revamp'), { recursive: true });
  const lastCss = out.lastIndexOf('<link rel="stylesheet"');
  const cut = out.indexOf('>', lastCss) + 1;
  // A content hash in the URL makes browsers pick up every change.
  const v = (f) => sha(readFileSync(join(REVAMP, f)));
  out = out.slice(0, cut) + `\n<link rel="stylesheet" href="revamp/revamp.css?v=${v('revamp.css')}">` + out.slice(cut);
  // tools.js first (its tools must be in the sidebar before the shell groups it), then revamp.js (the
  // shell), then every other script in revamp/ in name order.
  const FIRST = ['tools.js', 'revamp.js'], rank = (f) => (FIRST.indexOf(f) + 1) || 99;
  const scripts = readdirSync(REVAMP).filter((f) => f.endsWith('.js')).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  revampTags.js = scripts.map((f) => `<script src="revamp/${f}?v=${v(f)}"></script>\n`).join('');
}
// Every local file the page loads gets a content hash in its address, so a changed file is a new
// address and no browser or cache can hand back the old copy.
out = out.replace(/(<(?:link|script)\b[^>]*?(?:href|src)=")((?:css|js|data|fonts|icons)\/[^"?#]+)(")/g,
  (m, a, f, z) => (existsSync(join(OUT, f)) ? `${a}${f}?v=${sha(readFileSync(join(OUT, f)))}${z}` : m));
out = out.replace(/<\/body>(?![\s\S]*<\/body>)/, `${revampTags.js}</body>`);
write('index.html', out);
// Cache rules for static hosts that read a _headers file (Cloudflare Pages, Netlify): the page is always
// fetched fresh, and fonts and images (a hash in the file name) are kept for a year. These hosts cannot
// match ?v=, so everything else keeps their default, checked with the server each time. (vercel.json and
// npm start also keep ?v= files for a year.) No rule sets Cache-Control twice: both hosts would join them.
const keep = 'public, max-age=31536000, immutable';
write('_headers', ['/', '/index.html'].map((u) => `${u}\n  Cache-Control: no-store`).join('\n') +
  ['/fonts/*', '/img/*', '/icons/*'].map((u) => `\n${u}\n  Cache-Control: ${keep}`).join('') +
  '\n/*\n  X-Content-Type-Options: nosniff\n');

const files = walk(OUT).filter((f) => f !== '_headers').sort();
const total = files.reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
console.log(`GuruAgasthiya ${version}: ${files.length} files, ${(total / 1048576).toFixed(1)} MB -> ${relative(process.cwd(), OUT) || '.'}`);
// After a new APK: say at once if an element the revamp relies on was renamed or removed.
if (existsSync(REVAMP)) (await import('./check-contract.mjs')).checkContract();

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, base) : [relative(base, p)];
  });
}
// Names a block after its leading comment (e.g. "/* v6.8 Market Transit */" -> v6-8-market-transit).
function slug(body, fallback) {
  const c = body.trim().match(/^\/\*\s*-*\s*([^*\n]{3,60})/);
  return (c && slugText(c[1])) || fallback;
}
function slugText(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
