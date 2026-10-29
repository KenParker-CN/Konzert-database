/**
 * Removes translation keys that are no longer referenced anywhere in the source.
 *
 *   node scripts/prune-unused-i18n-keys.mjs           # report only
 *   node scripts/prune-unused-i18n-keys.mjs --write   # rewrite messages/*.json
 *
 * Keys built dynamically (e.g. `t(`navigation.${key}`)`) cannot be found by a
 * literal scan, so they are listed in KEEP and never removed.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.idea', '.vercel', 'scripts']);
const SOURCE_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
const LOCALES = ['en', 'zh', 'de', 'fr'];
const WRITE = process.argv.includes('--write');

/** Referenced through template literals or other indirection — always kept. */
const KEEP = new Set([
  // `t(`navigation.${key}`)` in components/AppShell.tsx
  'navigation.works',
]);

function collectSourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectSourceFiles(full));
    else if (SOURCE_EXT.test(entry.name)) found.push(full);
  }
  return found;
}

function flatten(node, prefix = '', out = []) {
  for (const [key, value] of Object.entries(node)) {
    const full = `${prefix}${key}`;
    if (typeof value === 'object' && value !== null) flatten(value, `${full}.`, out);
    else out.push(full);
  }
  return out;
}

/** Drops the given dotted paths, then removes any objects left empty. */
function prune(node, doomed, prefix = '') {
  if (typeof node !== 'object' || node === null) return node;
  const result = {};
  for (const [key, value] of Object.entries(node)) {
    const full = `${prefix}${key}`;
    if (typeof value === 'object' && value !== null) {
      const nested = prune(value, doomed, `${full}.`);
      if (Object.keys(nested).length > 0) result[key] = nested;
    } else if (!doomed.has(full)) {
      // Matched on the full dotted path so a same-named sibling survives.
      result[key] = value;
    }
  }
  return result;
}

const files = collectSourceFiles(ROOT);
const used = new Set();
const CALL = /\bt\(\s*['"]([A-Za-z][\w.]*)['"]/g;
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(CALL)) used.add(match[1]);
}

const doomed = new Set(
  flatten(JSON.parse(readFileSync(path.join(ROOT, 'messages', 'en.json'), 'utf8')))
    .filter((key) => !used.has(key) && !KEEP.has(key)),
);

console.log(`referenced keys: ${used.size}, removing: ${doomed.size}`);
for (const key of [...doomed].sort()) console.log(`  - ${key}`);
if (doomed.size === 0) {
  console.log('nothing to prune');
  process.exit(0);
}
if (!WRITE) {
  console.log('\nre-run with --write to apply');
  process.exit(0);
}

for (const locale of LOCALES) {
  const file = path.join(ROOT, 'messages', `${locale}.json`);
  const parsed = JSON.parse(readFileSync(file, 'utf8'));
  const pruned = prune(parsed, doomed);
  writeFileSync(file, `${JSON.stringify(pruned, null, 2)}\n`, 'utf8');
  console.log(`rewrote messages/${locale}.json`);
}
