#!/usr/bin/env node
// Zero-dependency static server for public/. Usage: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { brotliCompressSync, gzipSync, constants as Z } from 'node:zlib';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

// Text files are compressed like a real host would: Brotli where the browser accepts it, else gzip.
// Compressed copies are kept in memory until the file changes.
const packed = new Map();
function compressed(file, st, enc) {
  const key = `${file}|${enc}`, hit = packed.get(key);
  if (hit && hit.mtime === st.mtimeMs && hit.size === st.size) return hit.body;
  const raw = readFileSync(file);
  const body = enc === 'br'
    ? brotliCompressSync(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 9, [Z.BROTLI_PARAM_SIZE_HINT]: raw.length } })
    : gzipSync(raw, { level: 6 });
  packed.set(key, { mtime: st.mtimeMs, size: st.size, body });
  return body;
}

createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p.endsWith('/')) p += 'index.html';
  const file = join(ROOT, p);
  let st;
  try { st = file.startsWith(ROOT) && statSync(file); } catch {}
  if (!st || !st.isFile()) { res.writeHead(404).end('Not found'); return; }
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const accept = req.headers['accept-encoding'] || '';
  const text = /text|json|javascript|manifest|svg/.test(type) && st.size > 1024;
  const enc = text && /\bbr\b/.test(accept) ? 'br' : text && /\bgzip\b/.test(accept) ? 'gzip' : '';
  // The page is never stored. Versioned files (a ?v= content hash in the address, or a hash in the
  // file name under fonts/, img/ and icons/) never change, so the browser keeps them for a year
  // without asking again. Anything else is revalidated.
  const noStore = /(^|\/)index\.html$/.test(p);
  const versioned = !noStore && (new URL(req.url, 'http://x').searchParams.has('v') || /^\/(fonts|img|icons)\//.test(p));
  const etag = `"${st.size.toString(36)}-${Math.round(st.mtimeMs).toString(36)}${enc ? '-' + enc : ''}"`;
  const cache = noStore ? 'no-store' : versioned ? 'public, max-age=31536000, immutable' : 'no-cache';
  const head = { 'Cache-Control': cache, ETag: etag, ...(text ? { Vary: 'Accept-Encoding' } : {}) };
  if (!noStore && req.headers['if-none-match'] === etag) { res.writeHead(304, head).end(); return; }
  const body = enc ? compressed(file, st, enc) : readFileSync(file);
  res.writeHead(200, { 'Content-Type': type, ...head, ...(enc ? { 'Content-Encoding': enc } : {}), 'Content-Length': body.length });
  res.end(req.method === 'HEAD' ? undefined : body);
}).listen(PORT, () => console.log(`GuruAgasthiya web: http://localhost:${PORT}/`));
