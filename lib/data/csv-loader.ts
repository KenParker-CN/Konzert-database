import 'server-only';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {cookies} from 'next/headers';

const PUBLIC_DATA_REPO = 'KenParker-CN/konzert-public-data';
const RAW_CSV_BASE = `https://raw.githubusercontent.com/${PUBLIC_DATA_REPO}/main/csv`;
const CDN_CSV_BASE = `https://cdn.jsdelivr.net/gh/${PUBLIC_DATA_REPO}`;
const GITHUB_API_BASE = `https://api.github.com/repos/${PUBLIC_DATA_REPO}`;
const KV_API_URL = 'https://dme.mozarteum.at/digital-editions/api/kv-entriesidx';
// Vendored copy of the API response, used in preference to the live endpoint.
// Refresh with `node scripts/fetch-kv-entries.mjs`.
const KV_SNAPSHOT_FILE = 'kv-entries.json';
const DATA_CACHE_TTL_MS = 5 * 60 * 1000;
const DATA_VERSION_COOKIE = 'catalogue-data-version';
// Only reached when the snapshot above is missing or unreadable. The Mozarteum
// API serves a ~6 MB payload and routinely takes ~10 s, so the budget sits well
// below that: a slow call should abort and hand over to the KV.csv snapshot
// instead of stalling the page.
const KV_API_TIMEOUT_MS = 5000;

interface CsvWork {
  catalogue: string;
  title: string;
  type: string;
  key: string;
  instrumentation: string;
  [key: string]: string;
}

interface KvApiEntry {
  work_id: number;
  isPublished_KV: number;
  work_catalog_nr: {
    release: string;
    nr: string;
  };
  work_catalog_ref_nrs: Array<{
    release: string;
    nr: string;
  }> | null;
  kv_title: {
    lang: {
      DE?: string;
      EN?: string;
    };
  };
  nicknames?: {
    alias?: {
      lang?: {
        DE?: string;
        EN?: string;
      };
    } | null;
    new_kv?: string | null;
  } | null;
  movement?: string;
  vocal_title?: string;
  tempo?: string;
  music_key?: string;
  meter?: string;
  measures?: string;
  instruments?: string;
  genres?: Array<{
    lang?: {
      DE?: string;
      EN?: string;
    };
  }> | null;
  workSeriesGrps?: Array<{
    group?: {
      lang?: {
        DE?: string;
        EN?: string;
      };
    };
  }> | null;
  yearOfBegin?: string;
  yearOfTermination?: string;
  creationLocs?: Array<{
    lang?: {
      DE?: string;
      EN?: string;
    };
  }> | null;
}

interface CsvComposer {
  Name: string;
  'Sort Name': string;
  Catalogue: string;
  Birth: string;
  Died: string;
  Nationality: string;
  Nationality_2: string;
  Intro: string;
  Note: string;
  alias_org: string;
  alias_en: string;
  alias_de: string;
  alias_fr: string;
  alias_jp: string;
  alias_cn: string;
  [key: string]: string;
}

const csvCache = new Map<string, {
  expiresAt: number;
  version: string;
  request: Promise<CsvWork[]>;
}>();
let composersCache: {
  expiresAt: number;
  version: string;
  request: ReturnType<typeof fetchAndParseComposers>;
} | undefined;
const fallbackRevisionCache = new Map<string, {
  expiresAt: number;
  request: Promise<string>;
}>();

async function getDataVersion(): Promise<string> {
  const value = (await cookies()).get(DATA_VERSION_COOKIE)?.value;
  return value && /^[a-z0-9-]{1,64}$/i.test(value) ? value : '';
}

async function getFallbackRevision(version: string): Promise<string> {
  for (const [key, entry] of fallbackRevisionCache) {
    if (entry.expiresAt <= Date.now()) fallbackRevisionCache.delete(key);
  }
  const cached = fallbackRevisionCache.get(version);
  if (cached && cached.expiresAt > Date.now()) return cached.request;

  const request = (async () => {
    const url = new URL(`${GITHUB_API_BASE}/commits/main`);
    if (version) url.searchParams.set('_refresh', version);
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Konzert-database',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Failed to resolve public data revision: ${response.status}`);
    }

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('sha' in data)
      || typeof data.sha !== 'string' || !/^[a-f0-9]{40}$/i.test(data.sha)) {
      throw new Error('GitHub returned an invalid public data revision');
    }
    return data.sha;
  })();
  const cacheEntry = {expiresAt: Date.now() + DATA_CACHE_TTL_MS, request};
  fallbackRevisionCache.set(version, cacheEntry);
  try {
    return await request;
  } catch (error) {
    if (fallbackRevisionCache.get(version) === cacheEntry) fallbackRevisionCache.delete(version);
    throw error;
  }
}

async function fetchCsv(path: string, version = '') {
  const rawUrl = new URL(`${RAW_CSV_BASE}/${path}`);
  rawUrl.searchParams.set('_refresh', version || Date.now().toString(36));
  let rawError: unknown;

  try {
    const response = await fetch(rawUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return response;
    rawError = new Error(`Failed to load ${path} from GitHub raw: ${response.status}`);
  } catch (error) {
    rawError = error;
  }

  const revision = await getFallbackRevision(version);
  try {
    const response = await fetch(`${CDN_CSV_BASE}@${revision}/csv/${path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    if (response.ok) return response;
    throw new Error(`Failed to load ${path} from pinned CDN revision ${revision}: ${response.status}`);
  } catch (fallbackError) {
    throw new Error(`Failed to load ${path} from GitHub raw and pinned CDN`, {
      cause: new AggregateError([rawError, fallbackError]),
    });
  }
}

function isKvApiEntry(value: unknown): value is KvApiEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  const catalogueNumber = entry.work_catalog_nr;
  const title = entry.kv_title;

  return typeof entry.work_id === 'number'
    && typeof entry.isPublished_KV === 'number'
    && !!catalogueNumber
    && typeof catalogueNumber === 'object'
    && typeof (catalogueNumber as Record<string, unknown>).release === 'string'
    && typeof (catalogueNumber as Record<string, unknown>).nr === 'string'
    && !!title
    && typeof title === 'object'
    && !!(title as Record<string, unknown>).lang
    && typeof (title as Record<string, unknown>).lang === 'object';
}

const superscriptDigits: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function formatKvRelease(release: string): string {
  const match = /^KV(\d+)$/i.exec(release);
  return match ? `KV${[...match[1]].map(digit => superscriptDigits[digit]).join('')}` : release;
}

function mapKvApiEntries(value: unknown): CsvWork[] {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isKvApiEntry)) {
    throw new Error('Mozarteum KV API returned an invalid response');
  }

  const publishedEntries = value.filter(entry => entry.isPublished_KV === 1);
  if (publishedEntries.length === 0) {
    throw new Error('Mozarteum KV API returned no published entries');
  }

  return publishedEntries.map(entry => {
    const {release, nr} = entry.work_catalog_nr;
    const catalogue = release
      ? `${formatKvRelease(release)} ${nr}`.trim()
      : `KV ${nr}`.trim();
    const title = entry.kv_title.lang.EN?.trim() || entry.kv_title.lang.DE?.trim() || '';
    const genres = (entry.genres ?? [])
      .map(genre => genre.lang?.EN?.trim() || genre.lang?.DE?.trim() || '')
      .filter(Boolean);
    const groups = (entry.workSeriesGrps ?? [])
      .map(workSeriesGroup => workSeriesGroup.group?.lang?.EN?.trim() || workSeriesGroup.group?.lang?.DE?.trim() || '')
      .filter(Boolean);
    const references = (entry.work_catalog_ref_nrs ?? [])
      .filter(reference => reference.release !== release || reference.nr !== nr)
      .map(reference => `${formatKvRelease(reference.release)} ${reference.nr}`.trim())
      .filter(Boolean)
      .join(', ');
    const startYear = entry.yearOfBegin?.trim() ?? '';
    const endYear = entry.yearOfTermination?.trim() ?? '';
    const date = startYear && endYear && startYear !== endYear
      ? `${startYear}–${endYear}`
      : startYear || endYear;
    const nickname = entry.nicknames?.alias?.lang?.EN?.trim()
      || entry.nicknames?.alias?.lang?.DE?.trim()
      || '';
    const location = (entry.creationLocs ?? [])
      .map(place => place.lang?.EN?.trim() || place.lang?.DE?.trim() || '')
      .filter(place => place && !/^\[(unknown|unbekannt)]$/i.test(place))
      .join(', ');

    return {
      _workId: String(entry.work_id),
      catalogue,
      title,
      type: groups[0] ?? '',
      key: entry.music_key?.trim() ?? '',
      instrumentation: entry.instruments?.trim() ?? '',
      Date: date,
      ...(entry.kv_title.lang.DE?.trim() && entry.kv_title.lang.DE.trim() !== title
        ? {'German title': entry.kv_title.lang.DE.trim()}
        : {}),
      ...(nickname ? {Nickname: nickname} : {}),
      ...(references ? {'Other catalogue references': references} : {}),
      ...(entry.movement?.trim() ? {Movement: entry.movement.trim()} : {}),
      ...(entry.vocal_title?.trim() ? {'Vocal title': entry.vocal_title.trim()} : {}),
      ...(entry.tempo?.trim() ? {Tempo: entry.tempo.trim()} : {}),
      ...(entry.meter?.trim() ? {Meter: entry.meter.trim()} : {}),
      ...(entry.measures?.trim() ? {Measures: entry.measures.trim()} : {}),
      ...(genres.length ? {Genres: genres.join('; ')} : {}),
      ...(groups.length > 1 ? {Groups: groups.join('; ')} : {}),
      ...(location ? {'Creation location': location} : {}),
    };
  });
}

/**
 * Reads the checked-in KV snapshot from `public/kv-entries.json`.
 *
 * The Digital Mozart Edition API serves a ~6 MB payload that routinely takes
 * ~10 s to download, which used to be paid on every cold start. The index is
 * effectively frozen (the KV numbering has not changed in years), so it is
 * vendored into the repo instead — regenerate with `scripts/fetch-kv-entries.mjs`.
 *
 * `resolveJsonModule` is enabled, but importing the payload statically would
 * pull ~6 MB into the server bundle, so it is read from disk and parsed once.
 */
let kvSnapshotCache: {entries: unknown} | undefined;

async function readKvSnapshot(): Promise<unknown> {
  if (kvSnapshotCache) return kvSnapshotCache.entries;

  const snapshotPath = path.join(process.cwd(), 'public', KV_SNAPSHOT_FILE);
  const raw = await fs.readFile(snapshotPath, 'utf8');
  const entries: unknown = JSON.parse(raw);
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error(`KV snapshot ${KV_SNAPSHOT_FILE} is empty or malformed`);
  }

  kvSnapshotCache = {entries};
  return entries;
}

async function loadKvCatalog(version: string): Promise<CsvWork[]> {
  try {
    return mapKvApiEntries(await readKvSnapshot());
  } catch (snapshotError) {
    try {
      const url = new URL(KV_API_URL);
      url.searchParams.set('_refresh', version || Date.now().toString(36));
      const response = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(KV_API_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Mozarteum KV API request failed: ${response.status}`);
      }
      return mapKvApiEntries(await response.json());
    } catch (apiError) {
      try {
        const response = await fetchCsv('KV.csv', version);
        return parseCsvRecords<CsvWork>(await response.text());
      } catch (csvError) {
        throw new Error('Both the KV snapshot, Mozarteum KV API, and CSV fallback failed', {
          cause: new AggregateError([snapshotError, apiError, csvError]),
        });
      }
    }
  }
}

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
  const version = await getDataVersion();
  const cached = csvCache.get(catalogCode);
  if (cached && cached.version === version && cached.expiresAt > Date.now()) return cached.request;

  const request = catalogCode === 'KV'
    ? loadKvCatalog(version)
    : fetchCsv(`${catalogCode}.csv`, version)
      .then(async response => parseCsvRecords<CsvWork>(await response.text()));
  const cacheEntry = {expiresAt: Date.now() + DATA_CACHE_TTL_MS, version, request};
  csvCache.set(catalogCode, cacheEntry);
  try {
    return await request;
  } catch (error) {
    if (csvCache.get(catalogCode) === cacheEntry) csvCache.delete(catalogCode);
    throw error;
  }
}

type ComposerCsvEntry = {
  artistId: number;
  slug: string;
  name: string;
  nameSort: string;
  aliases: {
    org: string;
    en: string;
    de: string;
    fr: string;
    ja: string;
    zh: string;
  };
  nationalities: string[];
  type: string;
  artistCategory: string;
  startDate: string | null;
  endDate: string | null;
  biography: string | null;
  workCount: number;
  catalogueName: string | null | undefined;
};

async function fetchAndParseComposers(version: string): Promise<ComposerCsvEntry[]> {
  const response = await fetchCsv('composers.csv', version);
  const composers = parseCsvRecords(await response.text()) as CsvComposer[];

  return composers.map((composer, index) => {
    const name = composer.Name || '';
    const slug = slugify(name);
    const catalogueField = Object.keys(composer).find(
      field => field.toLocaleLowerCase() === 'catalogue',
    );
    return {
      artistId: index + 1,
      slug,
      name,
      nameSort: composer['Sort Name'] || '',
      aliases: {
        org: composer.alias_org || '',
        en: composer.alias_en || '',
        de: composer.alias_de || '',
        fr: composer.alias_fr || '',
        ja: composer.alias_jp || '',
        zh: composer.alias_cn || '',
      },
      nationalities: [composer.Nationality, composer.Nationality_2].filter(Boolean),
      type: 'composer',
      artistCategory: 'classical',
      startDate: composer.Birth || null,
      endDate: composer.Died || null,
      biography: composer.Intro || '',
      workCount: 0,
      // undefined: CSV without the Catalogue column; null: composer has no catalogue.
      catalogueName: catalogueField === undefined ? undefined : composer[catalogueField].trim() || null,
    };
  });

}

async function loadComposers(): Promise<ComposerCsvEntry[]> {
  const version = await getDataVersion();
  if (!composersCache || composersCache.version !== version || composersCache.expiresAt <= Date.now()) {
    composersCache = {
      expiresAt: Date.now() + DATA_CACHE_TTL_MS,
      version,
      request: fetchAndParseComposers(version || Date.now().toString(36)),
    };
  }
  const cacheEntry = composersCache;
  try {
    return await cacheEntry.request;
  } catch (error) {
    if (composersCache === cacheEntry) composersCache = undefined;
    throw error;
  }
}

export function clearCsvCache() {
  csvCache.clear();
  composersCache = undefined;
  // The snapshot never changes at runtime, but dropping it keeps "refresh"
  // honest after someone re-runs `scripts/fetch-kv-entries.mjs`.
  kvSnapshotCache = undefined;
}

function slugify(name: string) {
  return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseCsvRecords<T extends Record<string, string> = Record<string, string>>(text: string): T[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (!inQuotes && char === ',') {
      record.push(field);
      field = '';
    } else if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[index + 1] === '\n') index++;
      record.push(field);
      if (record.some(value => value.trim())) records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || record.length) {
    record.push(field);
    if (record.some(value => value.trim())) records.push(record);
  }

  const [headers, ...rows] = records;
  if (!headers) return [];

  return rows.map(row => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      const key = header.trim().replace(/^\uFEFF/, '');
      if (key) values[key] = row[index]?.trim() ?? '';
    });
    return values as T;
  });
}

function getCsvValue(record: CsvWork, ...fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const value = record[fieldName];
    if (value) return value;
    // Try case-insensitive match
    const lowerFieldName = fieldName.toLowerCase();
    for (const key in record) {
      if (key.toLowerCase() === lowerFieldName && record[key]) {
        return record[key];
      }
    }
  }
  return '';
}

export async function getComposers(): Promise<ComposerCsvEntry[]> {
  return loadComposers();
}

export async function getComposerWorks(catalogCode: string): Promise<Array<{
  workId: number;
  catalogue: string;
  opus: string;
  secondaryCatalogue: string;
  date: string;
  title: string;
  type: string;
  key: string;
  instrumentation: string;
  details: Record<string, string>;
}>> {
  const works = await loadCatalog(catalogCode);

  return works.map((work, index) => {
    const isOpusCatalogue = catalogCode === 'Corelli' || catalogCode === 'Shostakovich';
    let type = getCsvValue(work, 'Type', 'type');
    let key = getCsvValue(work, 'Key', 'key');
    if (catalogCode === 'Tchaikovsky' && /^[A-G]([#b])? (major|minor)$/.test(type.trim()) && !key) {
      // The Tchaikovsky CSV carries the key in the Type column for the symphonies.
      key = type;
      type = '';
    }

    return {
      workId: Number(work._workId) || index + 1,
      catalogue: isOpusCatalogue
        ? getCsvValue(work, 'Opus', 'opus') || getCsvValue(work, 'SORT', 'sort')
        : catalogCode === 'MWV'
        ? getCsvValue(work, 'MWV', 'Catalogue', 'catalogue')
        : catalogCode === 'LWV'
        ? getCsvValue(work, 'Catalogue', 'LWV', 'catalogue')
        : catalogCode === 'Tchaikovsky'
        ? getCsvValue(work, 'TH', 'th')
        : getCsvValue(work, 'Catalogue', 'catalogue', 'Wotquenne', 'Wq'),
      opus: isOpusCatalogue
        ? ''
        : getCsvValue(work, 'Opus', 'opus'),
      secondaryCatalogue: getCsvValue(work, 'Helm', 'H'),
      date: catalogCode === 'Tchaikovsky'
        ? getCsvValue(work, 'Year', 'year')
        : getCsvValue(work, 'Date', 'date'),
      title: getCsvValue(work, 'Title', 'title'),
      type,
      key,
      instrumentation: catalogCode === 'Shostakovich'
        ? getCsvValue(work, 'Setting', 'setting')
        : getCsvValue(work, 'Instrumentation', 'instrumentation'),
      details: Object.fromEntries(
        Object.entries(work).filter(([field, value]) => field && !field.startsWith('_') && value && !/(sort|order)/i.test(field)),
      ),
    };
  });
}