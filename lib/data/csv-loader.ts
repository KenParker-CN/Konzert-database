import 'server-only';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const KV_API_URL = 'https://dme.mozarteum.at/digital-editions/api/kv-entriesidx';
const LOCAL_CSV_DIR = path.join(process.cwd(), 'data', 'catalogues');
// Vendored copy of the API response, used in preference to the live endpoint.
// Refresh with `node scripts/fetch-kv-entries.mjs`.
const KV_SNAPSHOT_FILE = 'kv-entries.json';
const DATA_CACHE_TTL_MS = 5 * 60 * 1000;
// Only reached when the snapshot above is missing or unreadable. The Mozarteum
// API serves a ~6 MB payload and routinely takes ~10 s, so the budget sits well
// below that: a slow call should abort and hand over to the KV.csv snapshot
// instead of stalling the page.
const KV_API_TIMEOUT_MS = 5000;

interface CsvWork {
    catalogue: string;
    title: string;
    genre: string;
    key: string;
    instrumentation: string;

    [key: string]: string;
}

interface KvApiEntry {
    work_id: number;
    isPublished_KV: number;
    kv_section?: string;
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
        series?: {
            nr?: string | number;
            lang?: {
                DE?: string;
                EN?: string;
            };
        };
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
    alias_cn: string;

    [key: string]: string;
}

const csvCache = new Map<string, {
    expiresAt: number;
    request: Promise<CsvWork[]>;
}>();
let composersCache: {
    expiresAt: number;
    request: ReturnType<typeof fetchAndParseComposers>;
} | undefined;

async function fetchCsv(csvPath: string) {
    const fullPath = path.join(LOCAL_CSV_DIR, csvPath);
    console.log(`[fetchCsv] Reading: ${fullPath}`);
    const csvContent = await fs.readFile(fullPath, 'utf-8');
    console.log(`[fetchCsv] Read ${csvContent.length} bytes from ${csvPath}`);

    return {
        text: async () => csvContent,
    };
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
        const series = (entry.workSeriesGrps ?? [])
            .map(workSeriesGroup => workSeriesGroup.series?.lang?.EN?.trim() || workSeriesGroup.series?.lang?.DE?.trim() || '')
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
            _kvSection: entry.kv_section?.trim() ?? '',
            _kvNr: nr,
            catalogue,
            title,
            genre: series[0] || '',
            key: entry.music_key?.trim() ?? '',
            instrumentation: entry.instruments?.trim() ?? '',
            Date: date,
            ...(entry.kv_title.lang.DE?.trim() && entry.kv_title.lang.DE.trim() !== title
                ? {'German title': entry.kv_title.lang.DE.trim()}
                : {}),
            ...(nickname ? {Nickname: nickname} : {}),
            ...(references ? {'Other catalogue references': references} : {}),
            ...(entry.movement?.trim() ? {'Work structure': entry.movement.trim()} : {}),
            ...(entry.vocal_title?.trim() ? {'Vocal title': entry.vocal_title.trim()} : {}),
            ...(entry.tempo?.trim() ? {Tempo: entry.tempo.trim()} : {}),
            ...(entry.meter?.trim() ? {Meter: entry.meter.trim()} : {}),
            ...(entry.measures?.trim() ? {Measures: entry.measures.trim()} : {}),
            ...(series.length > 1 ? {Groups: series.join('; ')} : {}),
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
let kvSnapshotCache: { entries: unknown } | undefined;

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

async function fetchKvFromSnapshot(): Promise<CsvWork[]> {
    return mapKvApiEntries(await readKvSnapshot());
}

async function fetchKvFromApi(): Promise<CsvWork[]> {
    const response = await fetch(KV_API_URL, {
        cache: 'no-store',
        signal: AbortSignal.timeout(KV_API_TIMEOUT_MS),
    });
    if (!response.ok) {
        throw new Error(`Mozarteum KV API request failed: ${response.status}`);
    }
    return mapKvApiEntries(await response.json());
}

async function fetchKvFromCsv(): Promise<CsvWork[]> {
    const response = await fetchCsv('KV.csv');
    return parseCsvRecords<CsvWork>(await response.text());
}

/**
 * Loads the KV catalogue with a three-step fallback:
 * 1. the vendored snapshot (`public/kv-entries.json`),
 * 2. the live Mozarteum KV API (with a hard timeout),
 * 3. the local `data/catalogues/KV.csv`.
 *
 * Each step lives in its own function so that a failure is never caught by
 * the block that produced it, and every failure reason is preserved in the
 * final `AggregateError`.
 */
function loadKvCatalog(): Promise<CsvWork[]> {
    return (async () => {
        let snapshotError: unknown;
        try {
            return await fetchKvFromSnapshot();
        } catch (error) {
            snapshotError = error;
        }

        let apiError: unknown;
        try {
            return await fetchKvFromApi();
        } catch (error) {
            apiError = error;
        }

        try {
            return await fetchKvFromCsv();
        } catch (csvError) {
            throw new Error('Both the KV snapshot, Mozarteum KV API, and CSV fallback failed', {
                cause: new AggregateError([snapshotError, apiError, csvError]),
            });
        }
    })();
}

async function loadCatalog(catalogCode: string): Promise<CsvWork[]> {
    const cached = csvCache.get(catalogCode);
    if (cached && cached.expiresAt > Date.now()) return cached.request;

    const request = (async () => {
        if (catalogCode === 'KV') {
            return await loadKvCatalog();
        }
        const response = await fetchCsv(`${catalogCode}.csv`);
        return parseCsvRecords<CsvWork>(await response.text());
    })();
    const cacheEntry = {expiresAt: Date.now() + DATA_CACHE_TTL_MS, request};
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
    cataloguerName: string | null | undefined;
    era: string;
};

async function fetchAndParseComposers(): Promise<ComposerCsvEntry[]> {
    const csvPath = path.join(LOCAL_CSV_DIR, 'composers.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const composers = parseCsvRecords(csvContent) as CsvComposer[];

    return composers.map((composer, index) => {
        const name = composer.Name || '';
        const slug = slugify(name);
        const catalogueField = Object.keys(composer).find(
            field => field.toLocaleLowerCase() === 'catalogue',
        );
        const cataloguerField = Object.keys(composer).find(
            field => field.toLocaleLowerCase() === 'cataloguer',
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
            cataloguerName: cataloguerField === undefined ? undefined : composer[cataloguerField].trim() || null,
            era: composer.Era || '',
        };
    });

}

async function loadComposers(): Promise<ComposerCsvEntry[]> {
    if (!composersCache || composersCache.expiresAt <= Date.now()) {
        composersCache = {
            expiresAt: Date.now() + DATA_CACHE_TTL_MS,
            request: fetchAndParseComposers(),
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

export async function clearCatalogueCache(catalogCode: string) {
    csvCache.delete(catalogCode);
}

/**
 * Refreshes the KV catalogue for the "refresh" button. Tries the live
 * Mozarteum API first; if that is slow or fails (it routinely exceeds the
 * 5s budget from many locations), it silently falls back to the vendored
 * snapshot instead of surfacing an error. Since the KV numbering is stable,
 * the snapshot is an acceptable source, so the button never blocks the UI.
 */
export async function refreshKvFromApi(): Promise<void> {
    const works = await fetchKvFromApi().catch(() => fetchKvFromSnapshot());
    const cacheEntry = {
        expiresAt: Date.now() + DATA_CACHE_TTL_MS,
        request: Promise.resolve(works),
    };
    csvCache.set('KV', cacheEntry);
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

const OPUS_CATALOGUES = new Set(['Corelli', 'Shostakovich', 'Beethoven']);

/**
 * Resolves the catalogue number of a work. Every catalogue names its own
 * column, so the lookup order differs per catalogue.
 */
function getCatalogueNumber(work: CsvWork, catalogCode: string): string {
    switch (catalogCode) {
        case 'Corelli':
        case 'Shostakovich':
        case 'Beethoven':
            return getCsvValue(work, 'Opus', 'opus') || getCsvValue(work, 'SORT', 'sort');
        case 'Helm':
            return getCsvValue(work, 'Helm');
        case 'MWV':
            return getCsvValue(work, 'MWV', 'Catalogue', 'catalogue');
        case 'LWV':
            return getCsvValue(work, 'Catalogue', 'LWV', 'catalogue');
        case 'Tchaikovsky':
            return getCsvValue(work, 'TH', 'th');
        case 'Kirkpatrick':
            return getCsvValue(work, 'Kirkpatrick');
        default:
            return getCsvValue(work, 'Catalogue', 'catalogue', 'Wotquenne', 'Wq');
    }
}

/**
 * Resolves the alternative numbering of a work, e.g. Wotquenne for Helm or the
 * Longo and Pestelli systems for Kirkpatrick.
 */
function getSecondaryCatalogueNumber(work: CsvWork, catalogCode: string): string {
    switch (catalogCode) {
        case 'Helm':
            return getCsvValue(work, 'Wotquenne', 'Wq');
        case 'Kirkpatrick':
            return [getCsvValue(work, 'Longo'), getCsvValue(work, 'Pestelli')].filter(Boolean).join(' · ');
        case 'CNW':
            return getCsvValue(work, 'FS');
        default:
            return getCsvValue(work, 'Helm', 'H');
    }
}

export async function getComposers(): Promise<ComposerCsvEntry[]> {
    return loadComposers();
}

/** KV 分区（Köchel-Anhang）在目录中的排列顺序，用作内部排序主键。 */
const KV_SECTION_ORDER: Record<string, number> = {
    'Hauptteil': 0,
    'Anh. A': 1,
    'Anh. B': 2,
    'Anh. C': 3,
    'Anh. G': 4,
    'Anh. H': 5,
}

/**
 * 生成 KV 作品的排序键 = `[分区序号] [编号]`。分区优先（Hauptteil 在前，
 * 各 Anhang 依次），分区内再按编号（`1,01`、`9a`、`11,01-03` 等）排序。
 * 未知分区归到最末（序号 99）。
 */
function getKvSortKey(work: CsvWork): string {
    const section = (work as Record<string, unknown>)._kvSection as string | undefined
    const seq = KV_SECTION_ORDER[section ?? ''] ?? 99
    const nr = (work as Record<string, unknown>)._kvNr as string | undefined
    return `${seq} ${nr ?? ''}`
}
export async function getComposerWorks(catalogCode: string): Promise<Array<{
    workId: number;
    sort: string;
    catalogue: string;
    opus: string;
    secondaryCatalogue: string;
    date: string;
    title: string;
    genre: string;
    key: string;
    instrumentation: string;
    details: Record<string, string>;
}>> {
    const works = await loadCatalog(catalogCode);

    return works.map((work, index) => {
        const isOpusCatalogue = OPUS_CATALOGUES.has(catalogCode);
        // The Kirkpatrick sheet names its own columns and carries two alternative
        // numbering systems (Longo and Pestelli) next to the Kk. numbers.
        const isKirkpatrick = catalogCode === 'Kirkpatrick';
        const genre = getCsvValue(work, 'Genre', 'Type');
        const key = getCsvValue(work, 'Key');

        return {
            workId: Number(work._workId) || index + 1,
            sort: catalogCode === 'KV'
                ? getKvSortKey(work)
                : isKirkpatrick
                    ? getCsvValue(work, 'SORT_Kk')
                    : catalogCode === 'Ratner'
                        ? getCsvValue(work, 'SORT_R')
                        : getCsvValue(work, 'SORT', 'sort'),
            catalogue: getCatalogueNumber(work, catalogCode),
            opus: isOpusCatalogue
                ? ''
                : getCsvValue(work, 'Opus', 'opus'),
            secondaryCatalogue: getSecondaryCatalogueNumber(work, catalogCode),
            date: catalogCode === 'Tchaikovsky'
                ? getCsvValue(work, 'Year', 'year')
                : getCsvValue(work, 'Date', 'date'),
            title: getCsvValue(work, 'Title', 'title'),
            genre,
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
