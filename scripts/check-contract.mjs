#!/usr/bin/env node
// Import check: the revamp layer works on the engine's own elements (by id). After importing a new APK,
// this lists every id the revamp scripts and styles use that the new page no longer has.
// Runs at the end of `npm run import`, and with `npm test`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'public', 'index.html');
const REVAMP = join(ROOT, 'revamp');

export function checkContract({ quiet = false } = {}) {
  if (!existsSync(PAGE) || !existsSync(REVAMP)) return { missing: [], used: 0 };
  const html = readFileSync(PAGE, 'utf8');
  const engineJs = readdirSync(join(ROOT, 'public', 'js')).map((f) => readFileSync(join(ROOT, 'public', 'js', f), 'utf8')).join('\n');
  const have = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const used = new Map();
  const add = (id, file) => { if (!/^rv/.test(id)) (used.get(id) || used.set(id, new Set()).get(id)).add(file); };
  for (const f of readdirSync(REVAMP).filter((x) => /\.(js|css)$/.test(x))) {
    const src = readFileSync(join(REVAMP, f), 'utf8');
    if (f.endsWith('.js')) {
      for (const m of src.matchAll(/\$\('([A-Za-z][\w-]*)'\)|getElementById\('([A-Za-z][\w-]*)'\)/g)) add(m[1] || m[2], f);
      for (const m of src.matchAll(/'#([A-Za-z][\w-]*)[\s'.,:\[>]/g)) add(m[1], f);
    } else {
      for (const m of src.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/#([A-Za-z][\w-]*)(?=[\s.,:{>\[)+~])/g)) if (!/^[0-9a-fA-F]{3,8}$/.test(m[1])) add(m[1], f);
    }
  }
  // Ids the engine builds in code (not in the page source) still count when the engine's scripts name them.
  const missing = [...used.keys()].filter((id) => !have.has(id) && !engineJs.includes(`'${id}'`) && !engineJs.includes(`"${id}"`)).sort();
  if (!quiet) {
    if (missing.length) {
      console.log(`\nImport check: ${missing.length} of ${used.size} engine ids used by the revamp are missing from this APK:`);
      missing.forEach((id) => console.log(`  #${id}  (used in ${[...used.get(id)].join(', ')})`));
      console.log('Update revamp/ for the renamed or removed elements.');
    } else console.log(`Import check: all ${used.size} engine ids used by the revamp are present.`);
  }
  return { missing, used: used.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { missing } = checkContract();
  process.exitCode = missing.length ? 1 : 0;
}
