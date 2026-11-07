#!/usr/bin/env node
// Rebuilds public/ from a GuruAgasthiya APK.
//
// The Android app is a thin WebView shell around one self-contained
// assets/index.html. Its code already runs in a plain browser (it detects
// window.GuruApp and falls back to web APIs), so this script only splits that
// single file into cacheable pieces:
//   - every <style> / <script> block  -> css/*.css, js/*.js (same order)
//   - embedded @font-face fonts       -> fonts/*
//   - embedded images                 -> img/*
//   - cityData / landData JSON blocks -> data/*.js (window.GA_CITY / GA_LAND)
// It is a plain website: no web app manifest, no service worker, nothing to install.
//
// Usage: node scripts/import-apk.mjs [path/to/GuruAgasthiya-x.y.apk]

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const apk = resolve(process.argv[2] || join(ROOT, '..', 'GuruAgasthiya-7.7.apk'));

const html = execFileSync('unzip', ['-p', apk, 'assets/index.html'], { maxBuffer: 64 << 20 }).toString('utf8');
if (!html.includes('<html')) throw new Error('assets/index.html not found in ' + apk);

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
  if (/application\/json/.test(attrs)) {
    const glob = id === 'cityData' ? 'GA_CITY' : id === 'landData' ? 'GA_LAND' : null;
    if (!glob) return all; // unknown JSON block: keep inline
    JSON.parse(body); // validate
    const file = id === 'cityData' ? 'data/cities.js' : 'data/land.js';
    write(file, `window.${glob}=${body.trim()};\n`);
    // The map outline is only needed by Astrocartography; with the revamp layer it loads after the page.
    if (id === 'landData' && existsSync(join(ROOT, 'revamp', 'features.js'))) return '';
    return `<script src="${file}"></script>`;
  }
  if (/\bsrc=/.test(attrs)) return all;
  body = body
    .replace(/JSON\.parse\(\$\('cityData'\)\.textContent\)/g, 'window.GA_CITY')
    .replace(/JSON\.parse\(\$\('landData'\)\.textContent\)/g, 'window.GA_LAND');
  const label = /Astronomy library for JavaScript/.test(body) ? 'astronomy-engine'
    : slug(body, '') || (/const ORDER=\[/.test(body.slice(0, 400)) ? 'app'
    : /getElementById\('stage'\)/.test(body.slice(0, 400)) ? 'stage-layout' : 'script');
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
// alone is several MB), and the revamp would then rearrange it. Keep the page behind a plain splash in
// the chosen theme until the revamp has laid it out; revamp.js removes rv-boot.
if (existsSync(join(ROOT, 'revamp', 'revamp.js'))) {
  const boot = `<script>(function(){var d=document.documentElement;d.classList.add('rv-boot');` +
    `try{var a=localStorage.getItem('rvAppear');if(a)d.setAttribute('data-theme',a);}catch(e){}` +
    `addEventListener('load',function(){setTimeout(function(){d.classList.remove('rv-boot');},1500);});})();</script>\n` +
    `<style>@layer rvfix, engine;html.rv-boot{background:#F4F5F9}html.rv-boot[data-theme=dark]{background:#0D1020}` +
    `@media (prefers-color-scheme:dark){html.rv-boot:not([data-theme=light]){background:#0D1020}}` +
    `html.rv-boot body{background:transparent!important}html.rv-boot body>*{visibility:hidden!important}` +
    `html.rv-boot body::before{content:"GuruAgasthiya";position:fixed;inset:0;display:grid;place-items:center;` +
    `font:600 20px/1 system-ui,-apple-system,sans-serif;letter-spacing:-.01em;color:#8B8FAE}</style>\n`;
  out = out.replace(/(<meta name="viewport"[^>]*>\n?)/, `$1${boot}`);
}
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
  // revamp.js (the shell) first, then every other script in revamp/ in name order.
  const scripts = readdirSync(REVAMP).filter((f) => f.endsWith('.js')).sort((a, b) => (a === 'revamp.js' ? -1 : b === 'revamp.js' ? 1 : a.localeCompare(b)));
  revampTags.js = scripts.map((f) => `<script src="revamp/${f}?v=${v(f)}"></script>\n`).join('');
}
// Every local file the page loads gets a content hash in its address, so a changed file is a new
// address and no browser or cache can hand back the old copy.
out = out.replace(/(<(?:link|script)\b[^>]*?(?:href|src)=")((?:css|js|data|fonts|icons)\/[^"?#]+)(")/g,
  (m, a, f, z) => (existsSync(join(OUT, f)) ? `${a}${f}?v=${sha(readFileSync(join(OUT, f)))}${z}` : m));
out = out.replace(/<\/body>(?![\s\S]*<\/body>)/, `${revampTags.js}</body>`);
write('index.html', out);
// Cache rules for static hosts that read a _headers file (Cloudflare Pages, Netlify): the page is always
// fetched fresh, and every other file is checked with the server (they carry content hashes anyway).
write('_headers', ['/', '/index.html'].map((u) => `${u}\n  Cache-Control: no-store`).join('\n') +
  '\n/*\n  Cache-Control: no-cache\n  X-Content-Type-Options: nosniff\n');

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
