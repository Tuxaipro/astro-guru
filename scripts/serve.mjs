#!/usr/bin/env node
// Zero-dependency static server for public/. Usage: node scripts/serve.mjs [port]
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { createGzip } from 'node:zlib';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const PORT = Number(process.argv[2] || process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};

createServer((req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (p.endsWith('/')) p += 'index.html';
  const file = join(ROOT, p);
  let st;
  try { st = file.startsWith(ROOT) && statSync(file); } catch {}
  if (!st || !st.isFile()) { res.writeHead(404).end('Not found'); return; }
  const type = TYPES[extname(file)] || 'application/octet-stream';
  // Compress text files like a real host would (the city list goes from 6.9 MB to about 2.8 MB).
  const gzip = /text|json|javascript|manifest|svg/.test(type) && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  // The page, its build id and the service worker are never stored; everything else is revalidated
  // (versioned files change their address when they change).
  const noStore = /(^|\/)(index\.html|version\.json|sw\.js|pwa\.js)$/.test(p);
  const etag = `"${st.size.toString(36)}-${Math.round(st.mtimeMs).toString(36)}"`;
  const head = { 'Cache-Control': noStore ? 'no-store' : 'no-cache', ETag: etag };
  if (!noStore && req.headers['if-none-match'] === etag) { res.writeHead(304, head).end(); return; }
  res.writeHead(200, {
    'Content-Type': type, ...head,
    ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : { 'Content-Length': st.size }),
  });
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip({ level: 6 })) : stream).pipe(res);
}).listen(PORT, () => console.log(`GuruAgasthiya web: http://localhost:${PORT}/`));
