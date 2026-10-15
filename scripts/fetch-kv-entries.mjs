/**
 * Downloads the Digital Mozart Edition KV index once and stores it in `public/`
 * so the site never has to pay the ~10 s / ~6 MB round-trip on a cold start.
 *
 *   node scripts/fetch-kv-entries.mjs
 *
 * The payload is re-serialised from the parsed response rather than copied
 * verbatim, so the array shape and nesting stay exactly what `mapKvApiEntries()`
 * in `lib/data/csv-loader.ts` expects (a PowerShell ConvertFrom/ConvertTo-Json
 * round-trip would collapse the top-level array and silently truncate depth).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KV_API_URL = 'https://dme.mozarteum.at/digital-editions/api/kv-entriesidx';
const OUTPUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'kv-entries.json',
);

async function main() {
  const startedAt = Date.now();
  const response = await fetch(KV_API_URL, {
    headers: { 'User-Agent': 'Konzert-database' },
  });
  if (!response.ok) {
    throw new Error(`KV API request failed: ${response.status}`);
  }

  // Validate before touching disk: a truncated or reshaped payload would break
  // the runtime type guard in `isKvApiEntry`.
  const entries = await response.json();
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('KV API returned an unexpected payload');
  }
  const published = entries.filter((entry) => entry.isPublished_KV === 1).length;

  await mkdir(path.dirname(OUTPUT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify(entries), 'utf8');

  console.log(
    `Wrote ${OUTPUT} — ${entries.length} entries (${published} published) ` +
      `in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
