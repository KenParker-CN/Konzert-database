/**
 * Reports translation keys defined in messages/*.json that are never looked up
 * through `t('...')` anywhere in the source tree.
 *
 *   node scripts/find-unused-i18n-keys.mjs
 *
 * Read-only: it only prints the candidates so a human can confirm each one
 * before deleting anything.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', '.idea', '.vercel', 'scripts']);
const SOURCE_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;

function collectSourceFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectSourceFiles(full));
    } else if (SOURCE_EXT.test(entry.name)) {
      found.push(full);
    }
  }
  return found;
}

function flatten(node, prefix = '') {
  return Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

const files = collectSourceFiles(ROOT);
const used = new Set();
// Matches t('some.key') / t("some.key") with optional leading whitespace.
const CALL = /\bt\(\s*['"]([A-Za-z][\w.]*)['"]/g;

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(CALL)) used.add(match[1]);
}

const base = JSON.parse(readFileSync(path.join(ROOT, 'messages', 'en.json'), 'utf8'));
const defined = flatten(base);
const unused = defined.filter((key) => !used.has(key));

console.log(`scanned ${files.length} source files`);
console.log(`distinct t() keys referenced: ${used.size}`);
console.log(`keys defined in en.json:      ${defined.length}`);
console.log(`\nUNUSED (${unused.length}):`);
for (const key of unused) console.log(`  ${key}`);
